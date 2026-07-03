// check-email-exists — Supabase Edge Function
// Checks whether an email is registered in auth.users.
// Returns only { exists: boolean } — no user data is ever returned.
// Rate-limited per IP: 5 calls/minute (in-memory, best-effort).

const ALLOWED_ORIGIN = 'https://cifrapro.vercel.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

// ── Rate limiter ─────────────────────────────────────────────────────────────
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60_000

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }

  if (entry.count >= RATE_LIMIT) return true

  entry.count++
  return false
}

// Periodically prune stale entries so the Map doesn't grow unbounded
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip)
  }
}, 5 * 60_000)

// ── Handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    })
  }

  // Rate-limit by client IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Try again in a minute.' }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Parse and validate body
  let email: string
  try {
    const body = await req.json()
    email = String(body.email ?? '').toLowerCase().trim()
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid email.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Query GoTrue admin API with email filter — avoids fetching all users
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const gotrueUrl =
    `${supabaseUrl}/auth/v1/admin/users?` +
    new URLSearchParams({
      filter: email,
      page: '1',
      per_page: '10',
    }).toString()

  let exists = false
  try {
    const res = await fetch(gotrueUrl, {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    })

    if (!res.ok) {
      console.error('GoTrue error', res.status, await res.text())
      // Fail closed: return null so frontend shows generic message
      return new Response(JSON.stringify({ exists: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data: { users?: Array<{ email?: string }> } = await res.json()
    // Exact match only — the filter is a text search, not an exact query
    exists =
      data.users?.some(
        (u) => u.email?.toLowerCase().trim() === email
      ) ?? false
  } catch (err) {
    console.error('check-email-exists internal error', err)
    return new Response(JSON.stringify({ exists: null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Return ONLY exists flag — never return user data
  return new Response(JSON.stringify({ exists }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
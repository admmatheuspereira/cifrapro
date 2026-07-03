// purge-deleted-accounts — Supabase Edge Function
// Roda via Cron (Supabase Dashboard > Edge Functions > Cron, ou pg_cron).
// Encontra contas marcadas como deleted_at há mais de 30 dias e
// faz a exclusão DEFINITIVA (hard delete) — dados e usuário do auth.
// Isso NÃO deve ser chamado pelo frontend. Proteja com um secret
// próprio (CRON_SECRET) para que só o agendador consiga chamá-la.

import { createClient } from 'npm:@supabase/supabase-js@2'

const GRACE_PERIOD_HOURS = 24 * 30 // precisa bater com delete-user/index.ts

Deno.serve(async (req) => {
  // Proteção: só o cron (com o secret certo) pode chamar essa função.
  const cronSecret = Deno.env.get('CRON_SECRET')
  const providedSecret = req.headers.get('x-cron-secret')

  if (!cronSecret || providedSecret !== cronSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const cutoff = new Date(Date.now() - GRACE_PERIOD_HOURS * 60 * 60 * 1000).toISOString()

  // Busca contas cujo prazo de recuperação já expirou
  const { data: expiredProfiles, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoff)

  if (fetchError) {
    console.error('Erro ao buscar contas expiradas', fetchError)
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
  }

  if (!expiredProfiles || expiredProfiles.length === 0) {
    return new Response(JSON.stringify({ purged: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let purgedCount = 0
  const errors: Array<{ id: string; error: string }> = []

  for (const profile of expiredProfiles) {
    const userId = profile.id
    try {
      await supabaseAdmin.from('cifras').delete().eq('user_id', userId)
      await supabaseAdmin.from('hinarios').delete().eq('user_id', userId)
      await supabaseAdmin.from('profiles').delete().eq('id', userId)

      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteAuthError) {
        errors.push({ id: userId, error: deleteAuthError.message })
        continue
      }

      purgedCount++
    } catch (err) {
      errors.push({ id: userId, error: String(err) })
    }
  }

  console.log(`Purge concluída: ${purgedCount} contas removidas definitivamente.`)
  if (errors.length > 0) {
    console.error('Erros durante a purga', errors)
  }

  return new Response(
    JSON.stringify({ purged: purgedCount, errors }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
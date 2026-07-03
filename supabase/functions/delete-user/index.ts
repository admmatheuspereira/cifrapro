// delete-user — Supabase Edge Function
// SOFT DELETE: marca deleted_at nas tabelas do usuário e bane o login
// por 30 dias. A exclusão definitiva (hard delete) só acontece via
// a função purge-deleted-accounts, rodada em cron após esse prazo.
// Isso dá uma janela de recuperação caso a exclusão tenha sido
// acidental, causada por bug, ou o usuário se arrepender.

import { createClient } from 'npm:@supabase/supabase-js@2'

const ALLOWED_ORIGIN = 'https://cifrapro.vercel.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Janela de recuperação antes da purga definitiva
const GRACE_PERIOD_HOURS = 24 * 30 // 30 dias
const BAN_DURATION = `${GRACE_PERIOD_HOURS}h`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const now = new Date().toISOString()

  try {
    // Marca os dados como excluídos (soft delete) — não some do banco ainda
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ deleted_at: now })
      .eq('id', user.id)

    const { error: cifrasError } = await supabaseAdmin
      .from('cifras')
      .update({ deleted_at: now })
      .eq('user_id', user.id)

    const { error: hinariosError } = await supabaseAdmin
      .from('hinarios')
      .update({ deleted_at: now })
      .eq('user_id', user.id)

    if (profileError || cifrasError || hinariosError) {
      console.error('Soft delete error', { profileError, cifrasError, hinariosError })
      return new Response(
        JSON.stringify({ error: 'Falha ao marcar dados como excluídos.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Bane o login por 30 dias (mesma janela da purga).
    // Se o usuário quiser desistir da exclusão dentro do prazo,
    // um admin pode reverter via updateUserById({ ban_duration: 'none' })
    // e limpar deleted_at manualmente (ou criar um fluxo de "cancelar exclusão").
    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { ban_duration: BAN_DURATION }
    )

    if (banError) {
      console.error('Ban error', banError)
      return new Response(
        JSON.stringify({ error: 'Falha ao desativar login.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify({ success: true, gracePeriodDays: 30 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('delete-user internal error', err)
    return new Response(JSON.stringify({ error: 'Erro interno.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
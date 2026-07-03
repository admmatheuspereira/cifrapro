import { useState, useEffect, useRef } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Music } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import HCaptcha from '@hcaptcha/react-hcaptcha'

type Tab = 'login' | 'cadastro'
type View = 'auth' | 'forgot'

function getPasswordStrength(password: string): { level: 'fraca' | 'média' | 'forte'; score: number } {
  if (!password) return { level: 'fraca', score: 0 }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 2) return { level: 'fraca', score }
  if (score <= 3) return { level: 'média', score }
  return { level: 'forte', score }
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null
  const { level } = getPasswordStrength(password)
  const colors = { fraca: '#EF4444', média: '#F59E0B', forte: '#22C55E' }
  const widths = { fraca: '33%', média: '66%', forte: '100%' }
  const labels = { fraca: 'Fraca', média: 'Média', forte: 'Forte' }

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: '#E2E8F0' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{ width: widths[level], backgroundColor: colors[level] }}
        />
      </div>
      <p className="text-xs font-medium" style={{ color: colors[level] }}>
        Força da senha: {labels[level]}
      </p>
    </div>
  )
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres'
  if (!/[A-Z]/.test(password)) return 'A senha deve conter pelo menos 1 letra maiúscula'
  if (!/[0-9]/.test(password)) return 'A senha deve conter pelo menos 1 número'
  return null
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

function RightPanel() {
  return (
    <div
      className="hidden md:flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #006494 0%, #1B98E0 100%)',
        width: '60%',
        flexShrink: 0,
      }}
    >
      <Music
        size={320}
        className="absolute"
        style={{
          color: 'rgba(255,255,255,0.08)',
          bottom: '-40px',
          right: '-40px',
          transform: 'rotate(-15deg)',
        }}
      />
      <Music
        size={160}
        className="absolute"
        style={{
          color: 'rgba(255,255,255,0.06)',
          top: '30px',
          left: '30px',
          transform: 'rotate(10deg)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-12">
        <img src="/cf2.png" alt="CifraPro" className="h-16 w-auto mb-8 drop-shadow-lg" />
        <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
          CifraPro
        </h2>
        <p className="text-white/80 text-lg font-medium">
          Seu repertório, sempre com você
        </p>
        <div className="mt-10 flex flex-col gap-3 text-white/60 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
            Organize suas cifras e acordes
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
            Crie e gerencie hinários
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
            Acesse offline, em qualquer lugar
          </div>
        </div>
      </div>
    </div>
  )
}

const LOCKOUT_DURATION = 60
const MAX_ATTEMPTS = 5

export default function Auth() {
  const [tab, setTab] = useState<Tab>('login')
  const [view, setView] = useState<View>('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoverySent, setRecoverySent] = useState(false)

  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const captchaRef = useRef<HCaptcha>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState(false)

  useEffect(() => {
    if (lockoutUntil === null) return

    const tick = () => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000)
      if (remaining <= 0) {
        setCountdown(0)
        setLockoutUntil(null)
        setFailedAttempts(0)
        if (timerRef.current) clearInterval(timerRef.current)
      } else {
        setCountdown(remaining)
      }
    }

    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [lockoutUntil])

  // Reset captcha state whenever the user switches between Login and Cadastro tabs
  useEffect(() => {
    captchaRef.current?.resetCaptcha()
    setCaptchaToken(null)
    setCaptchaError(false)
  }, [tab])

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil

  function handleCaptchaVerify(token: string) {
    setCaptchaToken(token)
    setCaptchaError(false)
  }

  function handleCaptchaExpire() {
    setCaptchaToken(null)
    toast.error('O captcha expirou. Resolva novamente antes de continuar.')
  }

  function handleCaptchaError() {
    setCaptchaToken(null)
    setCaptchaError(true)
    toast.error('Erro ao carregar o captcha. Verifique sua conexão e tente novamente.')
  }

  function handleCaptchaChalExpired() {
    setCaptchaToken(null)
    toast.error('Desafio do captcha expirou. Resolva novamente.')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password || isLockedOut) return
    if (!captchaToken) {
      toast.error('Por favor, resolva o captcha antes de continuar.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken }
    })
    captchaRef.current?.resetCaptcha()
    setCaptchaToken(null)
    if (error) {
      const newAttempts = failedAttempts + 1
      if (newAttempts >= MAX_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_DURATION * 1000)
        setFailedAttempts(newAttempts)
        toast.error('Muitas tentativas. Aguarde 1 minuto.')
      } else {
        setFailedAttempts(newAttempts)
        if (error.message === 'Invalid login credentials') {
          toast.error('Email ou senha incorretos.')
        } else {
          toast.error(error.message)
        }
      }
    } else {
      setFailedAttempts(0)
      setLockoutUntil(null)
    }
    setLoading(false)
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password || !confirmPassword) return
    if (password !== confirmPassword) { toast.error('As senhas não coincidem'); return }
    const validationError = validatePassword(password)
    if (validationError) { toast.error(validationError); return }
    if (!captchaToken) {
      toast.error('Por favor, resolva o captcha antes de continuar.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        captchaToken
      }
    })
    captchaRef.current?.resetCaptcha()
    setCaptchaToken(null)
    if (error) {
      if (error.message.includes('already registered') ||
          error.message.includes('User already registered')) {
        toast.error('Este email já possui uma conta. Faça login.')
        setTab('login')
      } else {
        toast.error(error.message)
      }
    } else {
      setRegistered(true)
    }
    setLoading(false)
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) toast.error(error.message)
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!recoveryEmail) return
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) { toast.error(error.message) } else { setRecoverySent(true) }
    setLoading(false)
  }

  if (view === 'forgot') {
    return (
      <div className="min-h-screen flex">
        <div className="flex flex-col w-full md:w-[40%] min-h-screen bg-white px-8 py-10 justify-center">
          <div className="flex justify-center mb-8 md:hidden">
            <img src="/cf1.png" alt="CifraPro" className="h-8 w-auto" />
          </div>

          <div className="hidden md:block mb-10">
            <img src="/cf1.png" alt="CifraPro" className="h-7 w-auto" />
          </div>

          <div className="w-full max-w-sm mx-auto">
            <button
              onClick={() => setView('auth')}
              className="flex items-center gap-1.5 text-sm mb-8"
              style={{ color: '#4A5568' }}
            >
              <ArrowLeft size={15} />
              Voltar
            </button>

            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0C1B27' }}>
              Recuperar senha
            </h1>
            <p className="text-sm mb-8" style={{ color: '#4A5568' }}>
              Enviaremos um link para o seu email
            </p>

            {recoverySent ? (
              <div className="space-y-4">
                <div
                  className="rounded-xl p-5 text-sm text-center"
                  style={{ backgroundColor: 'rgba(27,152,224,0.08)', border: '1px solid rgba(27,152,224,0.3)', color: '#0C1B27' }}
                >
                  Link enviado para <strong>{recoveryEmail}</strong>. Verifique sua caixa de entrada.
                </div>
                <button
                  onClick={() => { setView('auth'); setRecoverySent(false); setRecoveryEmail('') }}
                  className="w-full text-sm text-center font-medium"
                  style={{ color: '#1B98E0' }}
                >
                  Voltar para o Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: '#0C1B27' }}>Email cadastrado</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A0AEC0' }} />
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        backgroundColor: '#F5F7FA',
                        border: '1.5px solid #E2E8F0',
                        color: '#0C1B27',
                      }}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: '#1B98E0' }}
                >
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </form>
            )}
          </div>
        </div>

        <RightPanel />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex flex-col w-full md:w-[40%] min-h-screen bg-white px-8 py-10">
        <div className="flex justify-center mb-8 md:hidden">
          <img src="/cf1.png" alt="CifraPro" className="h-8 w-auto" />
        </div>

        <div className="hidden md:block mb-10">
          <img src="/cf1.png" alt="CifraPro" className="h-7 w-auto" />
        </div>

        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">

          {registered ? (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#0C1B27' }}>Conta criada</h1>
                <p className="text-sm mt-1" style={{ color: '#4A5568' }}>Confirme seu email para continuar</p>
              </div>
              <div
                className="rounded-xl p-5 text-sm"
                style={{ backgroundColor: 'rgba(27,152,224,0.08)', border: '1px solid rgba(27,152,224,0.3)', color: '#0C1B27' }}
              >
                Verifique seu email para confirmar a conta antes de fazer login.
              </div>
              <button
                onClick={() => { setRegistered(false); setTab('login') }}
                className="text-sm font-medium"
                style={{ color: '#1B98E0' }}
              >
                Voltar para o Login
              </button>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold" style={{ color: '#0C1B27' }}>
                  {tab === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
                </h1>
                <p className="text-sm mt-1" style={{ color: '#4A5568' }}>
                  {tab === 'login'
                    ? 'Entre com suas credenciais para continuar'
                    : 'Preencha os dados para começar'}
                </p>
              </div>

              <div
                className="flex p-1 rounded-xl mb-7"
                style={{ backgroundColor: '#F5F7FA', border: '1.5px solid #E2E8F0' }}
              >
                {(['login', 'cadastro'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
                    style={{
                      backgroundColor: tab === t ? '#1B98E0' : 'transparent',
                      color: tab === t ? '#fff' : '#4A5568',
                    }}
                  >
                    {t === 'login' ? 'Entrar' : 'Criar conta'}
                  </button>
                ))}
              </div>

              {tab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: '#0C1B27' }}>Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A0AEC0' }} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                        style={{
                          backgroundColor: '#F5F7FA',
                          border: '1.5px solid #E2E8F0',
                          color: '#0C1B27',
                        }}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: '#0C1B27' }}>Senha</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A0AEC0' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                        style={{
                          backgroundColor: '#F5F7FA',
                          border: '1.5px solid #E2E8F0',
                          color: '#0C1B27',
                        }}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: '#A0AEC0' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setView('forgot')}
                        className="text-xs font-medium mt-0.5"
                        style={{ color: '#1B98E0' }}
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                  </div>

                  {isLockedOut && (
                    <div
                      className="rounded-xl px-4 py-3 text-sm font-medium text-center"
                      style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
                    >
                      Muitas tentativas. Aguarde {countdown}s.
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-2">
                    <HCaptcha
                      sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY ?? 'ea2cf4e2-a202-4776-a410-7914672c6c98'}
                      onVerify={handleCaptchaVerify}
                      onExpire={handleCaptchaExpire}
                      onError={handleCaptchaError}
                      onChalExpired={handleCaptchaChalExpired}
                      ref={captchaRef}
                      theme="light"
                      size="compact"
                    />
                    {captchaError && (
                      <p className="text-xs text-center" style={{ color: '#EF4444' }}>
                        Não foi possível carregar o captcha. Verifique sua conexão.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || isLockedOut || !captchaToken}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white mt-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: '#1B98E0' }}
                  >
                    {isLockedOut ? `Bloqueado (${countdown}s)` : loading ? 'Entrando...' : 'Entrar'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCadastro} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: '#0C1B27' }}>Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A0AEC0' }} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                        style={{
                          backgroundColor: '#F5F7FA',
                          border: '1.5px solid #E2E8F0',
                          color: '#0C1B27',
                        }}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: '#0C1B27' }}>Senha</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A0AEC0' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                        style={{
                          backgroundColor: '#F5F7FA',
                          border: '1.5px solid #E2E8F0',
                          color: '#0C1B27',
                        }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: '#A0AEC0' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={password} />
                    <p className="text-xs" style={{ color: '#A0AEC0' }}>
                      Mín. 8 caracteres, 1 maiúscula e 1 número
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: '#0C1B27' }}>Confirmar Senha</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A0AEC0' }} />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                        style={{
                          backgroundColor: '#F5F7FA',
                          border: '1.5px solid #E2E8F0',
                          color: '#0C1B27',
                        }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: '#A0AEC0' }}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <HCaptcha
                      sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY ?? 'ea2cf4e2-a202-4776-a410-7914672c6c98'}
                      onVerify={handleCaptchaVerify}
                      onExpire={handleCaptchaExpire}
                      onError={handleCaptchaError}
                      onChalExpired={handleCaptchaChalExpired}
                      ref={captchaRef}
                      theme="light"
                      size="compact"
                    />
                    {captchaError && (
                      <p className="text-xs text-center" style={{ color: '#EF4444' }}>
                        Não foi possível carregar o captcha. Verifique sua conexão.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !captchaToken}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white mt-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: '#1B98E0' }}
                  >
                    {loading ? 'Criando conta...' : 'Criar conta'}
                  </button>
                </form>
              )}

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: '#E2E8F0' }} />
                </div>
                <div className="relative flex justify-center">
                  <span
                    className="px-3 text-xs"
                    style={{ backgroundColor: '#fff', color: '#4A5568' }}
                  >
                    ou continue com
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoogle}
                type="button"
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50"
                style={{
                  border: '1.5px solid #E2E8F0',
                  backgroundColor: '#fff',
                  color: '#0C1B27',
                }}
              >
                <GoogleIcon />
                Entrar com Google
              </button>
            </>
          )}
        </div>
      </div>

      <RightPanel />
    </div>
  )
}

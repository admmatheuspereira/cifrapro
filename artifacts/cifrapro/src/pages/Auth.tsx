import { useState } from 'react'
import { Mail, Lock, Chrome, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

type Tab = 'login' | 'cadastro'

export default function Auth() {
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos'
        : error.message)
    }
    setLoading(false)
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password || !confirmPassword) return
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    if (password.length < 6) {
      toast.error('A senha deve ter ao menos 6 caracteres')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      setRegistered(true)
    }
    setLoading(false)
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) toast.error(error.message)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: '#0C1B27' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-2xl"
        style={{ backgroundColor: '#13293D' }}
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold" style={{ color: '#E9F0F1' }}>CifraPro</h1>
          <p className="text-sm mt-1" style={{ color: '#8FA3B1' }}>Seu repertório, sempre com você</p>
        </div>

        {registered ? (
          <div className="text-center space-y-4">
            <div
              className="rounded-xl p-5 text-sm"
              style={{ backgroundColor: '#1B98E020', border: '1px solid #1B98E060', color: '#E9F0F1' }}
            >
              Verifique seu email para confirmar a conta antes de fazer login.
            </div>
            <button
              onClick={() => { setRegistered(false); setTab('login') }}
              className="text-sm underline"
              style={{ color: '#1B98E0' }}
            >
              Voltar para o Login
            </button>
          </div>
        ) : (
          <>
            <div className="flex rounded-xl overflow-hidden mb-6" style={{ backgroundColor: '#0C1B27' }}>
              {(['login', 'cadastro'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-2.5 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: tab === t ? '#1B98E0' : 'transparent',
                    color: tab === t ? '#fff' : '#8FA3B1',
                    borderRadius: '0.75rem',
                  }}
                >
                  {t === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              ))}
            </div>

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label style={{ color: '#E9F0F1' }}>Email</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8FA3B1' }} />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-9"
                      style={{ backgroundColor: '#0C1B27', borderColor: '#1E3A50', color: '#E9F0F1' }}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: '#E9F0F1' }}>Senha</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8FA3B1' }} />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 pr-10"
                      style={{ backgroundColor: '#0C1B27', borderColor: '#1E3A50', color: '#E9F0F1' }}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: '#8FA3B1' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold mt-2"
                  style={{ backgroundColor: '#1B98E0', color: '#fff' }}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleCadastro} className="space-y-4">
                <div className="space-y-1.5">
                  <Label style={{ color: '#E9F0F1' }}>Email</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8FA3B1' }} />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-9"
                      style={{ backgroundColor: '#0C1B27', borderColor: '#1E3A50', color: '#E9F0F1' }}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: '#E9F0F1' }}>Senha</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8FA3B1' }} />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 pr-10"
                      style={{ backgroundColor: '#0C1B27', borderColor: '#1E3A50', color: '#E9F0F1' }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: '#8FA3B1' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: '#E9F0F1' }}>Confirmar Senha</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8FA3B1' }} />
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 pr-10"
                      style={{ backgroundColor: '#0C1B27', borderColor: '#1E3A50', color: '#E9F0F1' }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: '#8FA3B1' }}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold mt-2"
                  style={{ backgroundColor: '#1B98E0', color: '#fff' }}
                >
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </Button>
              </form>
            )}

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: '#1E3A50' }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs" style={{ backgroundColor: '#13293D', color: '#8FA3B1' }}>
                  ou continue com
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogle}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border font-medium text-sm transition-colors hover:opacity-90"
              style={{ borderColor: '#1E3A50', color: '#E9F0F1', backgroundColor: '#0C1B27' }}
            >
              <Chrome size={18} style={{ color: '#1B98E0' }} />
              Entrar com Google
            </button>
          </>
        )}
      </div>
    </div>
  )
}

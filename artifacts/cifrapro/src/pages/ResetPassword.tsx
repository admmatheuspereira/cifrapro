import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    const hash = window.location.hash
    if (hash.includes('access_token') || hash.includes('type=recovery')) {
      setSessionReady(true)
    }
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!password || !confirmPassword) return
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    if (password.length < 6) {
      toast.error('A senha deve ter ao menos 6 caracteres')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  const inputStyle = { backgroundColor: '#0C1B27', borderColor: '#1E3A50', color: '#E9F0F1' }

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
          <p className="text-sm mt-1" style={{ color: '#8FA3B1' }}>Definir nova senha</p>
        </div>

        {done ? (
          <div className="text-center space-y-5">
            <div className="flex justify-center">
              <CheckCircle size={48} style={{ color: '#1B98E0' }} />
            </div>
            <p className="text-sm" style={{ color: '#E9F0F1' }}>
              Senha atualizada com sucesso!
            </p>
            <a
              href="/"
              className="block text-sm underline"
              style={{ color: '#1B98E0' }}
            >
              Ir para o app
            </a>
          </div>
        ) : !sessionReady ? (
          <div className="text-center space-y-4">
            <p className="text-sm" style={{ color: '#8FA3B1' }}>
              Link inválido ou expirado. Solicite um novo link de recuperação de senha.
            </p>
            <a
              href="/auth"
              className="text-sm underline"
              style={{ color: '#1B98E0' }}
            >
              Voltar para o Login
            </a>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label style={{ color: '#E9F0F1' }}>Nova senha</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8FA3B1' }} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  style={inputStyle}
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
              <Label style={{ color: '#E9F0F1' }}>Confirmar nova senha</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8FA3B1' }} />
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  style={inputStyle}
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
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

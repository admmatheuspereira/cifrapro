import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useAppStore } from '../store/useAppStore'
import { toast } from 'sonner'
import { Cifra, Hinario, UserProfile } from '../types'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

async function migrateLocalStorage(userId: string): Promise<boolean> {
  const raw = localStorage.getItem('cifrapro-data')
  if (!raw) return false

  let parsed: { state?: { cifras?: Cifra[]; hinarios?: Hinario[]; profile?: UserProfile } }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return false
  }

  const state = parsed?.state
  if (!state) return false

  const localCifras: Cifra[] = state.cifras ?? []
  const localHinarios: Hinario[] = state.hinarios ?? []
  const localProfile: UserProfile | undefined = state.profile

  if (localCifras.length === 0 && localHinarios.length === 0) return false

  const { data: existing } = await supabase
    .from('cifras')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existing && existing.length > 0) return false

  const cifraRows = localCifras.map((c) => ({
    id: c.id,
    user_id: userId,
    title: c.title,
    artist: c.artist,
    key: c.key,
    content: c.content,
    created_at: new Date(c.createdAt).toISOString(),
    updated_at: new Date(c.updatedAt).toISOString(),
  }))

  const hinarioRows = localHinarios.map((h) => ({
    id: h.id,
    user_id: userId,
    name: h.name,
    cifra_ids: h.cifraIds,
    created_at: new Date(h.createdAt).toISOString(),
  }))

  if (cifraRows.length > 0) {
    const { error } = await supabase.from('cifras').insert(cifraRows)
    if (error) {
      console.error('Migration cifras error:', error)
      return false
    }
  }

  if (hinarioRows.length > 0) {
    const { error } = await supabase.from('hinarios').insert(hinarioRows)
    if (error) {
      console.error('Migration hinarios error:', error)
      return false
    }
  }

  if (localProfile) {
    await supabase.from('profiles').upsert({
      user_id: userId,
      name: localProfile.name,
      photo_url: localProfile.photoUrl,
      theme: localProfile.theme,
    })
  }

  localStorage.removeItem('cifrapro-data')
  return true
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { loadFromSupabase, clearData } = useAppStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        handleUserSignedIn(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'SIGNED_IN' && session?.user) {
        await handleUserSignedIn(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        clearData()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleUserSignedIn(userId: string) {
    setLoading(true)
    const migrated = await migrateLocalStorage(userId)
    if (migrated) {
      toast.success('Seus dados foram migrados com sucesso')
    }
    await loadFromSupabase(userId)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

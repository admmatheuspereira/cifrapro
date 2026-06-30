import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const [, setLocation] = useLocation()

  useEffect(() => {
    console.log('AuthCallback mounted', window.location.href)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setLocation('/')
      } else {
        setLocation('/auth')
      }
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )
}

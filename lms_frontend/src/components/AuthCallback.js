import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

/**
 * Handles Supabase auth callback and redirects.
 * If react-router-dom is not installed/used, replace useNavigate with window.location.
 */
export default function AuthCallback() {
  const navigate = (() => {
    try {
      return useNavigate()
    } catch {
      return null
    }
  })()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // getSessionFromUrl is used in Next.js; for CRA, the session is handled internally
        // We still attempt to exchange any code in URL if present.
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          // eslint-disable-next-line no-console
          console.error('Auth callback error:', error)
          if (navigate) navigate('/auth/error')
          else window.location.replace('/auth/error')
          return
        }
        if (data?.session) {
          if (navigate) navigate('/dashboard')
          else window.location.replace('/dashboard')
        } else {
          if (navigate) navigate('/')
          else window.location.replace('/')
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Auth callback exception:', e)
        if (navigate) navigate('/auth/error')
        else window.location.replace('/auth/error')
      }
    }
    handleAuthCallback()
  }, [navigate])

  return <div>Processing authentication...</div>
}

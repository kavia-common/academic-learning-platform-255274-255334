import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'

/**
 * Handles Supabase auth callback and redirects.
 * Attempts session retrieval and navigates the user appropriately.
 * Avoids logging sensitive data.
 *
 * Branches to password recovery if query param type=recovery is present.
 */
export default function AuthCallback() {
  const [status, setStatus] = useState('Processing authentication...')
  // Hooks must be called unconditionally at top level
  const navigate = useNavigate()
  const location = useLocation()
  const search = useMemo(() => new URLSearchParams(location.search), [location.search])
  const type = (search.get('type') || '').toLowerCase()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // If Supabase returned a recovery link, take the user to reset form
        if (type === 'recovery') {
          setStatus('Recovery link verified. Redirecting to reset password...')
          navigate('/auth/reset-password?type=recovery', { replace: true })
          return
        }

        const { data, error } = await supabase.auth.getSession()
        if (error) {
          setStatus('Authentication error. Redirecting...')
          navigate('/auth', { replace: true })
          return
        }
        if (data?.session) {
          setStatus('Authenticated. Redirecting to dashboard...')
          navigate('/dashboard', { replace: true })
        } else {
          setStatus('No session found. Redirecting to home...')
          navigate('/', { replace: true })
        }
      } catch {
        setStatus('Unexpected error. Redirecting...')
        navigate('/auth', { replace: true })
      }
    }
    handleAuthCallback()
  }, [navigate, type])

  return <div style={{ padding: 24 }}>{status}</div>
}

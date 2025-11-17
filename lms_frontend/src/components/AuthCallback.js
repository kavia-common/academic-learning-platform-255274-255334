import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

/**
 * Handles Supabase auth callback and redirects.
 * Attempts session retrieval and navigates the user appropriately.
 * Avoids logging sensitive data.
 */
export default function AuthCallback() {
  const [status, setStatus] = useState('Processing authentication...')
  // Hooks must be called unconditionally at top level
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          setStatus('Authentication error. Redirecting...')
          navigate('/auth')
          return
        }
        if (data?.session) {
          setStatus('Authenticated. Redirecting to dashboard...')
          navigate('/dashboard')
        } else {
          setStatus('No session found. Redirecting to home...')
          navigate('/')
        }
      } catch {
        setStatus('Unexpected error. Redirecting...')
        navigate('/auth')
      }
    }
    handleAuthCallback()
  }, [navigate])

  return <div style={{ padding: 24 }}>{status}</div>
}

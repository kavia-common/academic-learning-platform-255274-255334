import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authApi, supabase } from '../supabaseClient'

const THEME = {
  primary: '#2563EB',
  amber: '#F59E0B',
  error: '#EF4444',
  surface: '#ffffff',
  background: '#f9fafb',
  text: '#111827',
  border: 'rgba(0,0,0,0.08)',
  shadow: '0 8px 20px rgba(17,24,39,0.08)',
  radius: '12px',
}

const containerStyle = { minHeight: '100vh', background: THEME.background, color: THEME.text }
const cardStyle = { maxWidth: 520, margin: '32px auto', background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radius, padding: 24, boxShadow: THEME.shadow }
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${THEME.border}`, outline: 'none' }
const btnPrimary = { background: THEME.primary, border: 'none', padding: '10px 16px', borderRadius: 10, color: '#fff', cursor: 'pointer', boxShadow: THEME.shadow }
const linkBtn = { background: 'transparent', border: `1px solid ${THEME.border}`, padding: '8px 14px', borderRadius: 10, color: THEME.text, textDecoration: 'none' }

/**
 * PUBLIC_INTERFACE
 * SignIn page: email/password sign-in via supabase.auth.signInWithPassword
 * - Redirects to dashboard on success or back to intended route if provided via location.state.from
 */
export default function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const validate = () => {
    if (!/.+@.+\..+/.test(email)) return 'Please provide a valid email.'
    if (!password) return 'Please enter your password.'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setStatus('')
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setLoading(true)
    try {
      const { error: e1 } = await authApi.signInWithPassword(email, password)
      if (e1) {
        setError(e1.message || 'Sign in failed.')
        return
      }
      setStatus('Signed in. Redirecting...')
      // ensure session exists
      const { data } = await supabase.auth.getSession()
      if (data?.session) {
        navigate(redirectTo, { replace: true })
      } else {
        // Fallback to dashboard
        navigate('/dashboard', { replace: true })
      }
    } catch {
      setError('Unexpected error during sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        <div style={cardStyle} aria-live="polite">
          <h2 style={{ marginTop: 0 }}>Sign in</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }} aria-label="Sign in form">
            <label>
              <div style={{ fontSize: 14, marginBottom: 6 }}>Email</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={inputStyle}
                aria-required="true"
              />
            </label>
            <label>
              <div style={{ fontSize: 14, marginBottom: 6 }}>Password</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
                aria-required="true"
              />
            </label>
            <button type="submit" disabled={loading} style={btnPrimary} aria-busy={loading ? 'true' : 'false'}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <Link to="/auth/reset-password" style={linkBtn}>Forgot password</Link>
            <Link to="/signup" style={{ ...linkBtn, borderColor: THEME.primary, color: THEME.primary }}>Create account</Link>
          </div>
          {status && <p style={{ color: THEME.amber, marginTop: 8 }}>{status}</p>}
          {error && <p style={{ color: THEME.error, marginTop: 8 }} role="alert">{error}</p>}
        </div>
      </div>
    </div>
  )
}

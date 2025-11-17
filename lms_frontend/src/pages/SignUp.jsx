import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, authApi } from '../supabaseClient'

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
const btnGhost = { background: 'transparent', border: `1px solid ${THEME.border}`, padding: '8px 14px', borderRadius: 10, color: THEME.text, cursor: 'pointer', textDecoration: 'none' }

/**
 * PUBLIC_INTERFACE
 * SignUp page: email/password signup with optional role=admin or student.
 * - Uses supabase.auth.signUp via authApi.signUp
 * - On success: 
 *   - attempts to upsert profile (id=email owner)
 *   - if role === 'admin' and session exists (email-confirmed), insert into admin_users
 *   - If session not present yet (pending email confirmation), show message to check email
 * - Provides basic validation and error handling without logging secrets.
 */
export default function SignUp() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const validate = () => {
    if (!/.+@.+\..+/.test(email)) return 'Please provide a valid email.'
    if (!password || password.length < 6) return 'Password must be at least 6 characters.'
    if (role !== 'student' && role !== 'admin') return 'Role must be student or admin.'
    return ''
  }

  const upsertProfile = async (userId, userEmail) => {
    try {
      await supabase.from('profiles').upsert({ id: userId, email: userEmail })
    } catch {
      // silent; RLS or table may be different in some envs
    }
  }

  const insertAdminIfNeeded = async (userId) => {
    if (role !== 'admin' || !userId) return
    try {
      await supabase.from('admin_users').insert({ id: userId, role: 'admin' })
    } catch {
      // may fail due to RLS (if no admin exists yet) - that's ok; manual bootstrap might be needed
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('')
    setError('')
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setLoading(true)
    try {
      const { data, error: signErr } = await authApi.signUp(email, password)
      if (signErr) {
        setError(signErr.message || 'Sign up failed.')
        return
      }

      // If session exists immediately (email auto-confirmation enabled), we can continue with role/profile logic
      const currentSession = data?.session
      if (currentSession?.user?.id) {
        const uid = currentSession.user.id
        await upsertProfile(uid, email)
        await insertAdminIfNeeded(uid)
        setStatus('Account created. Redirecting...')
        navigate('/dashboard', { replace: true })
        return
      }

      // No session yet -> user needs to confirm email. Try to upsert profile via RPC on server or wait.
      setStatus('Sign up successful. Check your email to confirm your address.')
    } catch {
      setError('Unexpected error during sign up. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        <div style={cardStyle} aria-live="polite">
          <h2 style={{ marginTop: 0 }}>Create your account</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }} aria-label="Sign up form">
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
                minLength={6}
                placeholder="••••••••"
                style={inputStyle}
                aria-required="true"
              />
            </label>
            <label>
              <div style={{ fontSize: 14, marginBottom: 6 }}>Role</div>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle} aria-label="Role">
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button type="submit" disabled={loading} style={btnPrimary} aria-busy={loading ? 'true' : 'false'}>
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>
          <div style={{ marginTop: 10 }}>
            <span>Already have an account? </span>
            <Link to="/signin" style={{ color: THEME.primary, textDecoration: 'none' }}>Sign in</Link>
          </div>
          {status && <p style={{ color: THEME.amber, marginTop: 8 }}>{status}</p>}
          {error && <p style={{ color: THEME.error, marginTop: 8 }} role="alert">{error}</p>}
        </div>
      </div>
    </div>
  )
}

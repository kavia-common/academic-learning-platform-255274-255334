import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase, authApi } from '../supabaseClient'

/**
 * PUBLIC_INTERFACE
 * ResetPassword component supports:
 * 1) Phase A (request): user enters email to receive a reset link.
 * 2) Phase B (recovery): Supabase redirects back with type=recovery; the user sets a new password.
 *
 * Accessibility:
 * - Labels associated to inputs
 * - aria-live regions for status
 * - Proper button semantics and disabled states
 *
 * Note on redirects:
 * - Reset email uses redirectTo `${getURL()}auth/reset-password` configured in authApi.resetPassword
 * - On successful update of password, redirects to /dashboard if session exists.
 */
export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const search = useMemo(() => new URLSearchParams(location.search), [location.search])
  const isRecovery = (search.get('type') || '').toLowerCase() === 'recovery'

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // In recovery mode ensure we have a session created by Supabase magic link
    // If no session, instruct the user to re-initiate flow.
    const checkSession = async () => {
      if (!isRecovery) return
      const { data } = await supabase.auth.getSession()
      if (!data?.session) {
        setError('Recovery link is invalid or expired. Please request a new password reset.')
      }
    }
    checkSession()
  }, [isRecovery])

  const handleRequest = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setStatus('')
    try {
      // Basic validation
      if (!email || !/.+@.+\..+/.test(email)) {
        setError('Please enter a valid email address.')
        return
      }
      const { error: e1 } = await authApi.resetPassword(email)
      if (e1) {
        setError(e1.message)
      } else {
        setStatus('If your email is registered, you will receive a reset link shortly.')
      }
    } catch {
      setError('Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setStatus('')
    try {
      if (!newPassword || newPassword.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      const { error: e1 } = await supabase.auth.updateUser({ password: newPassword })
      if (e1) {
        setError(e1.message)
        return
      }
      setStatus('Password updated. Redirecting...')
      // If session exists, go to dashboard; otherwise to /auth
      const { data } = await supabase.auth.getSession()
      if (data?.session) {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/auth', { replace: true })
      }
    } catch {
      setError('Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Simple inline Ocean Professional theme tokens (kept in sync with App.js style)
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
  const contentStyle = { maxWidth: 520, margin: '32px auto', background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radius, padding: 24, boxShadow: THEME.shadow }
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${THEME.border}`, outline: 'none' }
  const btnPrimary = { background: THEME.primary, border: 'none', padding: '10px 16px', borderRadius: 10, color: '#fff', cursor: 'pointer', boxShadow: THEME.shadow }
  const btnGhost = { background: 'transparent', border: `1px solid ${THEME.border}`, padding: '8px 14px', borderRadius: 10, color: THEME.text, cursor: 'pointer' }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        <div style={contentStyle} aria-live="polite">
          <h2 style={{ marginTop: 0 }}>{isRecovery ? 'Set a new password' : 'Reset your password'}</h2>

          {!isRecovery && (
            <form onSubmit={handleRequest} style={{ display: 'grid', gap: 12 }} aria-label="Reset password form">
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
              <button type="submit" disabled={loading} style={btnPrimary} aria-busy={loading ? 'true' : 'false'}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <div>
                <Link to="/auth" style={btnGhost}>Back to sign in</Link>
              </div>
              {status && <p style={{ color: THEME.amber, marginTop: 6 }}>{status}</p>}
              {error && <p style={{ color: THEME.error, marginTop: 6 }}>{error}</p>}
            </form>
          )}

          {isRecovery && (
            <form onSubmit={handleUpdatePassword} style={{ display: 'grid', gap: 12 }} aria-label="Set new password form">
              <label>
                <div style={{ fontSize: 14, marginBottom: 6 }}>New password</div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  style={inputStyle}
                  aria-required="true"
                />
              </label>
              <label>
                <div style={{ fontSize: 14, marginBottom: 6 }}>Confirm new password</div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  style={inputStyle}
                  aria-required="true"
                />
              </label>
              <button type="submit" disabled={loading} style={btnPrimary} aria-busy={loading ? 'true' : 'false'}>
                {loading ? 'Updating...' : 'Update password'}
              </button>
              <div>
                <Link to="/" style={btnGhost}>Cancel</Link>
              </div>
              {status && <p style={{ color: THEME.amber, marginTop: 6 }}>{status}</p>}
              {error && <p style={{ color: THEME.error, marginTop: 6 }}>{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

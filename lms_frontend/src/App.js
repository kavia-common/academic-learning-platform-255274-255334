import React, { useEffect, useMemo, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import './App.css'
import { supabase, authApi } from './supabaseClient'
import AuthCallback from './components/AuthCallback'
import ResetPassword from './components/ResetPassword'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'

/**
 * Ocean Professional theme tokens for inline styles
 */
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

function Container({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: THEME.background, color: THEME.text }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>{children}</div>
    </div>
  )
}

function Navbar({ session }) {
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(false)
  const [adminError, setAdminError] = useState('')

  const isAuthed = !!session?.user

  // Determine admin visibility by checking admin_users table for current user
  useEffect(() => {
    let mounted = true
    const checkAdmin = async () => {
      // Reset states on change
      if (!session?.user?.id) {
        if (mounted) {
          setIsAdmin(false)
          setCheckingAdmin(false)
          setAdminError('')
        }
        return
      }
      setCheckingAdmin(true)
      setAdminError('')
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle()
        if (!mounted) return
        if (error) {
          setIsAdmin(false)
          // Surface concise error in UI only if user is looking for Admin (kept subtle)
          setAdminError(error.message || 'Unable to verify admin access')
        } else {
          setIsAdmin(!!data)
        }
      } catch (ex) {
        if (!mounted) return
        setIsAdmin(false)
        setAdminError(ex?.message || 'Unable to verify admin access')
      } finally {
        if (mounted) setCheckingAdmin(false)
      }
    }
    checkAdmin()
    return () => { mounted = false }
  }, [session?.user?.id])

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      await authApi.signOut()
      navigate('/')
    } catch (ex) {
      // Keep message concise and safe
      // eslint-disable-next-line no-console
      console.warn('Sign out failed:', ex?.message || 'unknown error')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div style={{
      background: THEME.surface, borderBottom: `1px solid ${THEME.border}`,
      position: 'sticky', top: 0, zIndex: 20
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: THEME.text }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${THEME.primary}22, #ffffff)` , border: `1px solid ${THEME.border}`, display: 'grid', placeItems: 'center', boxShadow: THEME.shadow }}>
            <span style={{ color: THEME.primary, fontWeight: 700 }}>L</span>
          </div>
          <strong>Ocean LMS</strong>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }} role="navigation" aria-label="Primary">
          <Link to="/courses" style={linkStyle} aria-label="Courses">Courses</Link>
          {isAuthed && <Link to="/dashboard" style={linkStyle} aria-label="Dashboard">Dashboard</Link>}
          {isAuthed && !checkingAdmin && isAdmin && (
            <Link to="/admin" style={linkStyle} aria-label="Admin">Admin</Link>
          )}
          {isAuthed ? (
            <button onClick={handleSignOut} disabled={signingOut} style={btnStyle('ghost')} aria-label="Sign out">
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          ) : (
            <Link to="/auth" style={buttonAsLinkStyle} aria-label="Sign in">Sign in</Link>
          )}
        </div>
      </div>
      {/* Subtle inline notice only if there was an admin check error and user is logged in */}
      {isAuthed && adminError && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 8px' }}>
          <div style={{ color: THEME.amber, fontSize: 12 }}>{adminError}</div>
        </div>
      )}
    </div>
  )
}

const linkStyle = {
  color: THEME.text,
  textDecoration: 'none',
  padding: '8px 10px',
  borderRadius: 8,
  border: `1px solid transparent`,
}

const buttonAsLinkStyle = {
  background: THEME.primary,
  color: '#fff',
  textDecoration: 'none',
  padding: '8px 14px',
  borderRadius: 10,
  boxShadow: THEME.shadow,
}

function btnStyle(variant = 'primary') {
  if (variant === 'ghost') {
    return {
      background: 'transparent',
      border: `1px solid ${THEME.border}`,
      padding: '8px 14px',
      borderRadius: 10,
      color: THEME.text,
      cursor: 'pointer',
    }
  }
  return {
    background: THEME.primary,
    border: 'none',
    padding: '10px 16px',
    borderRadius: 10,
    color: '#fff',
    cursor: 'pointer',
    boxShadow: THEME.shadow,
  }
}

/**
 * Hook: Subscribe to Supabase auth session
 */
function useSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (mounted) setSession(data.session || null)
      setLoading(false)
    })()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])
  return { session, loading }
}

/**
 * PUBLIC_INTERFACE
 * Protected route component that requires an authenticated user.
 */
function ProtectedRoute({ children }) {
  const { session, loading } = useSession()
  const location = useLocation()

  if (loading) return <PageStatus title="Loading" subtitle="Checking session..." />
  if (!session) return <Navigate to="/auth" state={{ from: location }} replace />
  return children
}

/**
 * PUBLIC_INTERFACE
 * Admin route guard. Checks admin_users table contains current user id.
 */
function AdminRoute({ children }) {
  const { session, loading } = useSession()
  const [isAdmin, setIsAdmin] = useState(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const check = async () => {
      if (!session?.user) {
        setIsAdmin(false)
        setChecking(false)
        return
      }
      try {
        const { data, error: e1 } = await supabase.from('admin_users').select('id').eq('id', session.user.id).maybeSingle()
        if (e1) {
          setIsAdmin(false)
          setError(e1.message || '')
        } else {
          setIsAdmin(!!data)
        }
      } catch (ex) {
        setIsAdmin(false)
        setError(ex?.message || '')
      } finally {
        setChecking(false)
      }
    }
    if (!loading) check()
  }, [loading, session])

  if (loading || checking) return <PageStatus title="Loading" subtitle="Verifying admin access..." />
  if (!session) return <Navigate to="/auth" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

/**
 * Status component for loading/error/empty states
 */
function PageStatus({ title, subtitle, tone = 'info' }) {
  const color = tone === 'error' ? THEME.error : tone === 'warning' ? THEME.amber : THEME.primary
  return (
    <Container>
      <div style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radius, boxShadow: THEME.shadow, padding: 24 }}>
        <h2 style={{ margin: 0, color }}>{title}</h2>
        {subtitle && <p style={{ marginTop: 8, opacity: 0.9 }}>{subtitle}</p>}
      </div>
    </Container>
  )
}

/**
 * Landing Page
 */
function Home() {
  return (
    <Container>
      <div style={{ display: 'grid', gap: 20 }}>
        <div style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radius, padding: 24, boxShadow: THEME.shadow }}>
          <h1 style={{ margin: 0 }}>Welcome to Ocean LMS</h1>
          <p style={{ marginTop: 8 }}>A lightweight learning platform. Sign in to access your dashboard.</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
            <Link to="/courses" style={buttonAsLinkStyle}>Browse Courses</Link>
            <Link to="/auth" style={{ ...buttonAsLinkStyle, background: THEME.amber, color: '#111827' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </Container>
  )
}

/**
 * Auth Page: email magic link or password sign-in
 */
function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('magic')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const onMagic = async (e) => {
    e.preventDefault()
    setLoading(true); setMessage(''); setError('')
    try {
      const { error: e1 } = await authApi.signInWithMagicLink(email)
      if (e1) setError(e1.message)
      else setMessage('Check your email for a magic link.')
    } catch (ex) {
      setError('Failed to send magic link.')
    } finally {
      setLoading(false)
    }
  }

  const onPassword = async (e) => {
    e.preventDefault()
    setLoading(true); setMessage(''); setError('')
    try {
      const { error: e1 } = await authApi.signInWithPassword(email, password)
      if (e1) setError(e1.message)
      else setMessage('Signed in. Redirecting...')
      // Redirect handled by auth listener at App level routes
    } catch {
      setError('Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <div style={{ maxWidth: 480, margin: '24px auto', background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radius, padding: 24, boxShadow: THEME.shadow }}>
        <h2 style={{ marginTop: 0 }}>Sign in</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => setMode('magic')} style={{ ...btnStyle(mode === 'magic' ? 'primary' : 'ghost') }}>Magic Link</button>
          <button onClick={() => setMode('password')} style={{ ...btnStyle(mode === 'password' ? 'primary' : 'ghost') }}>Password</button>
        </div>
        <form onSubmit={mode === 'magic' ? onMagic : onPassword} style={{ display: 'grid', gap: 10 }} aria-label="Authentication form">
          <label>
            <div style={{ fontSize: 14, marginBottom: 6 }}>Email</div>
            <input
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="you@example.com"
              aria-required="true"
              aria-label="Email address"
            />
          </label>
          {mode === 'password' && (
            <label>
              <div style={{ fontSize: 14, marginBottom: 6 }}>Password</div>
              <input
                type="password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                required
                style={inputStyle}
                placeholder="••••••••"
                aria-required="true"
                aria-label="Password"
              />
            </label>
          )}
          <button type="submit" disabled={loading} style={btnStyle('primary')} aria-busy={loading ? 'true' : 'false'}>
            {loading ? 'Please wait...' : (mode === 'magic' ? 'Send Magic Link' : 'Sign in')}
          </button>
        </form>
        {mode === 'password' && (
          <div style={{ marginTop: 8, textAlign: 'left' }}>
            <Link to="/auth/reset-password" style={{ color: THEME.primary, textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>
        )}
        {message && <p style={{ marginTop: 10, color: THEME.amber }} role="status">{message}</p>}
        {error && <p style={{ marginTop: 10, color: THEME.error }} role="alert">{error}</p>}
        <p style={{ marginTop: 14, opacity: 0.9 }}>After magic link, you'll be redirected to /auth/callback.</p>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Link to="/signin" style={{ ...btnStyle('ghost'), textDecoration: 'none', display: 'inline-block' }}>Use email/password</Link>
          <Link to="/signup" style={{ ...buttonAsLinkStyle, textDecoration: 'none' }}>Create an account</Link>
        </div>
      </div>
    </Container>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${THEME.border}`,
  outline: 'none',
}

/**
 * Courses list page
 */
function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data, error: e1 } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
        if (e1) throw e1
        if (mounted) setCourses(data || [])
      } catch (ex) {
        setError(`Failed to load courses: ${ex?.message || 'unknown error'}`)
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <PageStatus title="Loading courses..." />
  if (error) return <PageStatus title="Error" subtitle={error} tone="error" />
  return (
    <Container>
      <div style={{ display: 'grid', gap: 16 }}>
        <h2 style={{ margin: 0 }}>Courses</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {courses.length === 0 && <PageStatus title="No courses" subtitle="Please check back later." />}
          {courses.map((c) => (
            <Link key={c.id} to={`/courses/${c.id}`} style={{
              textDecoration: 'none', color: THEME.text,
              background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radius, padding: 16, boxShadow: THEME.shadow
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <strong>{c.title}</strong>
                  <p style={{ margin: 6, opacity: 0.9 }}>{c.description}</p>
                </div>
                <span style={{ fontSize: 12, color: THEME.primary }}>View →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Container>
  )
}

/**
 * Course detail page with assignments list and optional embedded video
 */
function CourseDetailPage() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [{ data: c, error: e1 }, { data: a, error: e2 }] = await Promise.all([
          supabase.from('courses').select('*').eq('id', id).maybeSingle(),
          supabase.from('assignments').select('*').eq('course_id', id).order('created_at', { ascending: false }),
        ])
        if (e1) throw e1
        if (e2) throw e2
        if (mounted) {
          setCourse(c)
          setAssignments(a || [])
        }
      } catch (ex) {
        setError(`Failed to load course: ${ex?.message || 'unknown error'}`)
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  if (loading) return <PageStatus title="Loading course..." />
  if (error) return <PageStatus title="Error" subtitle={error} tone="error" />
  if (!course) return <PageStatus title="Not found" subtitle="Course does not exist." tone="warning" />

  const embedVideo = (url) => {
    if (!url) return null
    return (
      <div style={{ marginTop: 12 }}>
        <iframe
          title="Course video"
          src={url}
          style={{ width: '100%', height: 360, border: 0, borderRadius: 12 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <Container>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radius, padding: 24, boxShadow: THEME.shadow }}>
          <h2 style={{ marginTop: 0 }}>{course.title}</h2>
          <p style={{ marginTop: 6, opacity: 0.9 }}>{course.description}</p>
          {embedVideo(course.video_url)}
        </div>
        <div style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radius, padding: 24, boxShadow: THEME.shadow }}>
          <h3 style={{ marginTop: 0 }}>Assignments</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {assignments.length === 0 && <p>No assignments yet.</p>}
            {assignments.map((a) => (
              <Link key={a.id} to={`/assignments/${a.id}`} style={{ textDecoration: 'none', color: THEME.text }}>
                <div style={{ border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{a.title}</strong>
                    <p style={{ marginTop: 6, opacity: 0.9 }}>{a.description}</p>
                  </div>
                  <span style={{ fontSize: 12, color: THEME.primary }}>Open →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Container>
  )
}

/**
 * Assignment detail with submission link
 */
function AssignmentDetailPage() {
  const { id } = useParams()
  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data, error: e1 } = await supabase.from('assignments').select('*').eq('id', id).maybeSingle()
        if (e1) throw e1
        if (mounted) setAssignment(data)
      } catch (ex) {
        setError(`Failed to load assignment: ${ex?.message || 'unknown error'}`)
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  if (loading) return <PageStatus title="Loading assignment..." />
  if (error) return <PageStatus title="Error" subtitle={error} tone="error" />
  if (!assignment) return <PageStatus title="Not found" subtitle="Assignment does not exist." tone="warning" />

  return (
    <Container>
      <div style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radius, padding: 24, boxShadow: THEME.shadow }}>
        <h2 style={{ marginTop: 0 }}>{assignment.title}</h2>
        <p style={{ marginTop: 6, opacity: 0.9 }}>{assignment.description}</p>
        {assignment.due_date && <p style={{ marginTop: 8 }}>Due: {new Date(assignment.due_date).toLocaleString()}</p>}
        <div style={{ marginTop: 12 }}>
          <Link to={`/assignments/${assignment.id}/submit`} style={buttonAsLinkStyle}>Submit Assignment</Link>
        </div>
      </div>
    </Container>
  )
}

/**
 * Employee Dashboard: Available courses + user's submissions
 */
function DashboardPage() {
  const { session } = useSession()
  const userId = session?.user?.id
  const [courses, setCourses] = useState([])
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Always load courses for authenticated users
        const { data: c, error: eCourses } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false })
        if (eCourses) throw eCourses

        let s = []
        // Only attempt submissions load if userId is present to satisfy RLS (student_id = auth.uid())
        if (userId) {
          // Step 1: get submissions for this user (no joins to avoid relation name mismatches)
          const { data: subsData, error: eSubs } = await supabase
            .from('submissions')
            .select('id, assignment_id, content, file_url, grade, submitted_at')
            .eq('student_id', userId)
            .order('submitted_at', { ascending: false })
          if (eSubs) throw eSubs

          s = subsData || []

          // Step 2: enrich submissions with assignment titles in one batched query
          const assignmentIds = Array.from(new Set(s.map((x) => x.assignment_id).filter(Boolean)))
          if (assignmentIds.length > 0) {
            const { data: assignRows, error: eAssign } = await supabase
              .from('assignments')
              .select('id, title')
              .in('id', assignmentIds)
            if (eAssign) throw eAssign
            const titleMap = new Map((assignRows || []).map((a) => [a.id, a.title]))
            s = s.map((row) => ({ ...row, assignment_title: titleMap.get(row.assignment_id) || 'Assignment' }))
          }
        }

        if (mounted) {
          setCourses(c || [])
          setSubs(s)
        }
      } catch (ex) {
        setError(`Failed to load dashboard data: ${ex?.message || 'unknown error'}`)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [userId])

  if (loading) return <PageStatus title="Loading dashboard..." />
  if (error) return <PageStatus title="Error loading dashboard" subtitle={error} tone="error" />

  return (
    <Container>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radius, padding: 24, boxShadow: THEME.shadow }}>
          <h2 style={{ marginTop: 0 }}>Available Courses</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {courses.map(c => (
              <Link key={c.id} to={`/courses/${c.id}`} style={{ textDecoration: 'none', color: THEME.text }}>
                <div style={{ border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 12 }}>
                  <strong>{c.title}</strong>
                  <p style={{ marginTop: 6, opacity: 0.9 }}>{c.description}</p>
                </div>
              </Link>
            ))}
            {courses.length === 0 && <p>No courses yet.</p>}
          </div>
        </div>
        <div style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radius, padding: 24, boxShadow: THEME.shadow }}>
          <h2 style={{ marginTop: 0 }}>My Submissions</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {subs.length === 0 && <p>You have no submissions yet.</p>}
            {subs.map(s => (
              <div key={s.id} style={{ border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{s.assignment_title || 'Assignment'}</strong>
                    <p style={{ marginTop: 6, opacity: 0.9 }}>{s.content?.slice?.(0, 140) || s.file_url || 'Submitted'}</p>
                  </div>
                  <div style={{ fontSize: 12, color: THEME.primary }}>
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  )
}

/**
 * Admin Dashboard: links to create course/assignment
 */
function AdminDashboard() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data, error: e1 } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
        if (e1) throw e1
        if (mounted) setCourses(data || [])
      } catch (ex) {
        setError(`Failed to load admin data: ${ex?.message || 'unknown error'}`)
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <PageStatus title="Loading admin..." />
  if (error) return <PageStatus title="Error" subtitle={error} tone="error" />

  return (
    <Container>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/admin/courses/new" style={buttonAsLinkStyle}>Create Course</Link>
          <Link to="/admin/assignments/new" style={{ ...buttonAsLinkStyle, background: THEME.amber, color: THEME.text }}>Create Assignment</Link>
        </div>
        <div style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radius, padding: 24, boxShadow: THEME.shadow }}>
          <h2 style={{ marginTop: 0 }}>All Courses</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {courses.map(c => (
              <div key={c.id} style={{ border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 12 }}>
                <strong>{c.title}</strong>
                <p style={{ marginTop: 6, opacity: 0.9 }}>{c.description}</p>
              </div>
            ))}
            {courses.length === 0 && <p>No courses yet.</p>}
          </div>
        </div>
      </div>
    </Container>
  )
}

/**
 * Create Course Form
 */
function CreateCourse() {
  const navigate = useNavigate()
  const { session } = useSession()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const ownerId = session?.user?.id
      if (!ownerId) {
        throw new Error('No authenticated user for owner_id.')
      }
      const insert = {
        title,
        description,
        video_url: (videoUrl || '').trim() ? videoUrl.trim() : null,
        owner_id: ownerId, // required by RLS
      }
      const { error: e1 } = await supabase.from('courses').insert(insert)
      if (e1) throw e1
      navigate('/admin')
    } catch (ex) {
      setError(`Failed to create course: ${ex?.message || 'unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <FormCard title="Create Course" onSubmit={onSubmit} loading={loading} error={error}>
        <Field label="Title">
          <input style={inputStyle} value={title} onChange={(e)=>setTitle(e.target.value)} required />
        </Field>
        <Field label="Description">
          <textarea style={{ ...inputStyle, minHeight: 100 }} value={description} onChange={(e)=>setDescription(e.target.value)} />
        </Field>
        <Field label="Video URL (optional)">
          <input style={inputStyle} value={videoUrl} onChange={(e)=>setVideoUrl(e.target.value)} />
        </Field>
      </FormCard>
    </Container>
  )
}

/**
 * Create Assignment Form
 */
function CreateAssignment() {
  const navigate = useNavigate()
  const { session } = useSession()
  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data, error: e1 } = await supabase.from('courses').select('id,title').order('created_at', { ascending: false })
        if (e1) throw e1
        if (mounted) setCourses(data || [])
      } catch (ex) {
        if (mounted) setError(ex?.message || 'Failed to load courses')
      }
    })()
    return () => { mounted = false }
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const creatorId = session?.user?.id
      if (!creatorId) {
        throw new Error('No authenticated user for created_by.')
      }
      if (!courseId) {
        throw new Error('Please select a course.')
      }
      const insert = {
        title,
        description,
        course_id: courseId,
        due_date: (dueDate || '').trim() ? dueDate : null,
        created_by: creatorId, // required by RLS
      }
      const { error: e1 } = await supabase.from('assignments').insert(insert)
      if (e1) throw e1
      navigate('/admin')
    } catch (ex) {
      setError(`Failed to create assignment: ${ex?.message || 'unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <FormCard title="Create Assignment" onSubmit={onSubmit} loading={loading} error={error}>
        <Field label="Course">
          <select style={inputStyle} value={courseId} onChange={(e)=>setCourseId(e.target.value)} required>
            <option value="" disabled>Select a course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </Field>
        <Field label="Title">
          <input style={inputStyle} value={title} onChange={(e)=>setTitle(e.target.value)} required />
        </Field>
        <Field label="Description">
          <textarea style={{ ...inputStyle, minHeight: 100 }} value={description} onChange={(e)=>setDescription(e.target.value)} />
        </Field>
        <Field label="Due Date (optional)">
          <input type="datetime-local" style={inputStyle} value={dueDate} onChange={(e)=>setDueDate(e.target.value)} />
        </Field>
      </FormCard>
    </Container>
  )
}

/**
 * Submit Assignment form
 */
function SubmitAssignmentPage() {
  const { session } = useSession()
  const navigate = useNavigate()
  const { id } = useParams()
  const [assignment, setAssignment] = useState(null)
  const [content, setContent] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data, error: e1 } = await supabase.from('assignments').select('id,title').eq('id', id).maybeSingle()
        if (e1) throw e1
        if (mounted) setAssignment(data)
      } catch {
        setError('Failed to load assignment.')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!session?.user) {
      setError('You must be signed in to submit.')
      return
    }
    setSaving(true); setError('')
    try {
      const payload = {
        assignment_id: id,
        student_id: session.user.id, // required by RLS
        content,
        file_url: (fileUrl || '').trim() ? fileUrl.trim() : null,
        submitted_at: new Date().toISOString(),
      }
      const { error: e1 } = await supabase.from('submissions').insert(payload)
      if (e1) throw e1
      navigate('/dashboard')
    } catch (ex) {
      setError(`Failed to submit assignment: ${ex?.message || 'unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageStatus title="Loading..." />
  if (error) return <PageStatus title="Error" subtitle={error} tone="error" />
  if (!assignment) return <PageStatus title="Not found" subtitle="Assignment does not exist." tone="warning" />

  return (
    <Container>
      <FormCard title={`Submit: ${assignment.title}`} onSubmit={onSubmit} loading={saving} error={error}>
        <Field label="Content / Notes">
          <textarea style={{ ...inputStyle, minHeight: 120 }} value={content} onChange={(e)=>setContent(e.target.value)} />
        </Field>
        <Field label="File URL (optional)">
          <input style={inputStyle} value={fileUrl} onChange={(e)=>setFileUrl(e.target.value)} />
        </Field>
      </FormCard>
    </Container>
  )
}

/**
 * Shared form components
 */
function FormCard({ title, onSubmit, loading, error, children }) {
  return (
    <div style={{ maxWidth: 640, margin: '24px auto', background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radius, padding: 24, boxShadow: THEME.shadow }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        {children}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" disabled={loading} style={btnStyle('primary')}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <Link to={-1} style={buttonAsLinkStyle}>Cancel</Link>
        </div>
        {error && <p style={{ color: THEME.error }}>{error}</p>}
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <div style={{ fontSize: 14 }}>{label}</div>
      {children}
    </label>
  )
}

/**
 * Root App with routing
 */
// PUBLIC_INTERFACE
function App() {
  const { session, loading } = useSession()

  return (
    <Router>
      <Navbar session={session} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={loading ? <PageStatus title="Loading..." /> : (session ? <Navigate to="/dashboard" replace /> : <AuthPage />)} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/signup" element={loading ? <PageStatus title="Loading..." /> : (session ? <Navigate to="/dashboard" replace /> : <SignUp />)} />
        <Route path="/signin" element={loading ? <PageStatus title="Loading..." /> : (session ? <Navigate to="/dashboard" replace /> : <SignIn />)} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
        <Route path="/assignments/:id/submit" element={
          <ProtectedRoute>
            <SubmitAssignmentPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/courses/new" element={
          <AdminRoute>
            <CreateCourse />
          </AdminRoute>
        } />
        <Route path="/admin/assignments/new" element={
          <AdminRoute>
            <CreateAssignment />
          </AdminRoute>
        } />
        <Route path="*" element={<PageStatus title="404" subtitle="Page not found." tone="warning" />} />
      </Routes>
    </Router>
  )
}

export default App

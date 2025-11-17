import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

jest.mock('../supabaseClient', () => {
  const { makeSupabaseMock } = require('../testUtils/supabaseMock')
  // Start unauthenticated; individual tests will adjust return values if needed.
  const supabase = makeSupabaseMock({ authSession: null })
  return {
    supabase,
    authApi: {
      signOut: jest.fn(async () => ({ error: null })),
      signInWithPassword: jest.fn(async () => ({ data: {}, error: null })),
      signInWithMagicLink: jest.fn(async () => ({ data: {}, error: null })),
      resetPassword: jest.fn(async () => ({ data: {}, error: null })),
    },
  }
})

describe('Auth Flows (magic link, email/password)', () => {
  const { supabase, authApi } = require('../supabaseClient')

  beforeEach(() => {
    jest.clearAllMocks()
    // Default session calls
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })
  })

  test('Magic link flow sends request and shows confirmation message', async () => {
    render(
      <MemoryRouter initialEntries={['/auth']}>
        <App />
      </MemoryRouter>
    )

    // On /auth, default mode is 'magic'
    const emailInput = await screen.findByLabelText(/Email address/i)
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } })

    const submitBtn = screen.getByRole('button', { name: /Send Magic Link/i })
    fireEvent.click(submitBtn)

    // Should call authApi.signInWithMagicLink and show a status message
    expect(authApi.signInWithMagicLink).toHaveBeenCalledWith('user@example.com')
    await screen.findByText(/Check your email for a magic link/i)
  })

  test('Switch to Password mode and sign in via email/password', async () => {
    render(
      <MemoryRouter initialEntries={['/auth']}>
        <App />
      </MemoryRouter>
    )

    // Switch to Password mode
    const passwordTab = await screen.findByRole('button', { name: /Password/i })
    fireEvent.click(passwordTab)

    const emailInput = screen.getByLabelText(/Email address/i)
    const pwInput = screen.getByLabelText(/Password/i)
    fireEvent.change(emailInput, { target: { value: 'u@example.com' } })
    fireEvent.change(pwInput, { target: { value: 'secret123' } })

    const signInBtn = screen.getByRole('button', { name: /^Sign in$/i })
    fireEvent.click(signInBtn)

    expect(authApi.signInWithPassword).toHaveBeenCalledWith('u@example.com', 'secret123')
    await screen.findByText(/Signed in. Redirecting/i)
  })
})

describe('Reset Password flows (request and recovery)', () => {
  const { supabase, authApi } = require('../supabaseClient')

  beforeEach(() => {
    jest.clearAllMocks()
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })
  })

  test('Reset password request triggers email', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })

    render(
      <MemoryRouter initialEntries={['/auth/reset-password']}>
        <App />
      </MemoryRouter>
    )

    const emailInput = await screen.findByLabelText(/Email/i)
    fireEvent.change(emailInput, { target: { value: 'reset@example.com' } })

    const sendBtn = screen.getByRole('button', { name: /Send reset link/i })
    fireEvent.click(sendBtn)

    expect(authApi.resetPassword).toHaveBeenCalledWith('reset@example.com')
    await screen.findByText(/you will receive a reset link/i)
  })

  test('Reset password recovery updates password and redirects to dashboard when session exists', async () => {
    // Recovery phase should have an active session (created by Supabase via recovery link)
    const session = { user: { id: 'user-10' } }
    supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null })
    supabase.auth.updateUser.mockResolvedValue({ data: {}, error: null })

    render(
      <MemoryRouter initialEntries={['/auth/reset-password?type=recovery']}>
        <App />
      </MemoryRouter>
    )

    const newPw = await screen.findByLabelText(/New password/i)
    const confirmPw = screen.getByLabelText(/Confirm new password/i)
    fireEvent.change(newPw, { target: { value: 'newsecret' } })
    fireEvent.change(confirmPw, { target: { value: 'newsecret' } })

    fireEvent.click(screen.getByRole('button', { name: /Update password/i }))

    // After update, with session, navigate to dashboard
    await screen.findByText(/Available Courses/i)
  })
})

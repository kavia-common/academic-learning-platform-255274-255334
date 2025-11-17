import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AuthCallback from '../AuthCallback'

jest.mock('../../supabaseClient', () => {
  const { makeSupabaseMock } = require('../../testUtils/supabaseMock')
  const supabase = makeSupabaseMock()
  return {
    supabase,
    authApi: {}
  }
})

const renderWithRoute = (initialEntry) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/auth" element={<div>Auth Page</div>} />
        <Route path="/auth/reset-password" element={<div>Reset Password</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('AuthCallback', () => {
  const { supabase } = require('../../supabaseClient')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('type=recovery redirects to reset password recovery page', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    renderWithRoute('/auth/callback?type=recovery')
    await screen.findByText(/Reset Password/i)
  })

  test('session present -> redirects to dashboard', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null })
    renderWithRoute('/auth/callback')
    await screen.findByText(/Dashboard/i)
  })

  test('no session -> redirects to home', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    renderWithRoute('/auth/callback')
    await screen.findByText(/^Home$/i)
  })

  test('auth error -> redirects to auth', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: { message: 'boom' } })
    renderWithRoute('/auth/callback')
    await screen.findByText(/Auth Page/i)
  })
})

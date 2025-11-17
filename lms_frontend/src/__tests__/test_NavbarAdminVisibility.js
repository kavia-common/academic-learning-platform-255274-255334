import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { buildSelectChain } from '../testUtils/supabaseMock'

// We customize supabaseClient per-test with our mock factory.
jest.mock('../supabaseClient', () => {
  const { makeSupabaseMock } = require('../testUtils/supabaseMock')
  // default: unauthenticated unless overridden in tests
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

describe('Navbar Admin link visibility', () => {
  const { supabase } = require('../supabaseClient')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Unauthenticated: Admin link is not rendered', async () => {
    // No session by default
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    // Wait for initial render
    await screen.findByLabelText(/Courses/i)
    // Admin link should not be present
    expect(screen.queryByLabelText(/Admin/i)).toBeNull()
  })

  test('Authenticated non-admin: Admin link hidden', async () => {
    const fakeSession = { user: { id: 'user-123' } }
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: fakeSession }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    // Navbar checks admin_users where id = session.user.id and expects null for non-admin
    const adminCheckChain = buildSelectChain({ data: null, error: null })
    supabase.from.mockImplementation((table) => {
      if (table === 'admin_users') return adminCheckChain
      // default safe responses for other tables that might load
      return {
        select: jest.fn(() => ({
          order: jest.fn(async () => ({ data: [], error: null }))
        })),
      }
    })

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    // Courses link renders
    await screen.findByLabelText(/Courses/i)
    // Admin link not present
    expect(screen.queryByLabelText(/Admin/i)).toBeNull()
    // Dashboard (for authed) can appear
    expect(screen.getByLabelText(/Dashboard/i)).toBeInTheDocument()
  })

  test('Authenticated admin: Admin link visible', async () => {
    const fakeSession = { user: { id: 'admin-99' } }
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: fakeSession }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    // Return a row from admin_users to mark as admin
    const adminCheckChain = buildSelectChain({ data: { id: 'admin-99' }, error: null })
    supabase.from.mockImplementation((table) => {
      if (table === 'admin_users') return adminCheckChain
      return {
        select: jest.fn(() => ({
          order: jest.fn(async () => ({ data: [], error: null }))
        })),
      }
    })

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    await screen.findByLabelText(/Courses/i)
    // Admin link should be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/Admin/i)).toBeInTheDocument()
    })
  })
})

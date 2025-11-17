import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { buildSelectChain } from './testUtils/supabaseMock'

jest.mock('./supabaseClient', () => {
  const { makeSupabaseMock } = require('./testUtils/supabaseMock')
  // default unauth unless overridden in tests
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

describe('App root smoke and navbar', () => {
  const { supabase } = require('./supabaseClient')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders main navigation including Courses link', async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )
    expect(await screen.findByLabelText(/Courses/i)).toBeInTheDocument()
  })

  test('Navbar: Admin link visible only for admin users', async () => {
    const adminSession = { user: { id: 'admin-xyz' } }
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: adminSession }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    // admin_users returns a row -> isAdmin = true
    const adminCheckChain = buildSelectChain({ data: { id: 'admin-xyz' }, error: null })
    supabase.from.mockImplementation((table) => {
      if (table === 'admin_users') return adminCheckChain
      return {
        select: jest.fn(() => ({
          order: jest.fn(async () => ({ data: [], error: null })),
        })),
      }
    })

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    // Courses link should render; Admin shows for admin after check completes
    await screen.findByLabelText(/Courses/i)
    await waitFor(() => {
      expect(screen.getByLabelText(/Admin/i)).toBeInTheDocument()
    })
  })

  test('Navbar: Non-admin user does not see Admin link', async () => {
    const userSession = { user: { id: 'user-noadmin' } }
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: userSession }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    // admin_users returns null -> not admin
    const adminCheckChain = buildSelectChain({ data: null, error: null })
    supabase.from.mockImplementation((table) => {
      if (table === 'admin_users') return adminCheckChain
      return {
        select: jest.fn(() => ({
          order: jest.fn(async () => ({ data: [], error: null })),
        })),
      }
    })

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    await screen.findByLabelText(/Courses/i)
    expect(screen.queryByLabelText(/Admin/i)).toBeNull()
  })

  test('Navbar: Unauthenticated user does not see Admin link', async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    await screen.findByLabelText(/Courses/i)
    expect(screen.queryByLabelText(/Admin/i)).toBeNull()
  })
})

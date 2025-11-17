import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { buildSelectChain } from '../testUtils/supabaseMock'

// Override supabaseClient for these tests to control session and DB responses.
jest.mock('../supabaseClient', () => {
  const { makeSupabaseMock } = require('../testUtils/supabaseMock')
  // default: unauthenticated
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

describe('Navbar Admin link visibility (admin_users based)', () => {
  const { supabase } = require('../supabaseClient')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Unauthenticated users do not see Admin link', async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    await screen.findByLabelText(/Courses/i)
    expect(screen.queryByLabelText(/Admin/i)).toBeNull()
  })

  test('Authenticated non-admin does not see Admin link', async () => {
    const session = { user: { id: 'user-not-admin' } }
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    // admin_users check returns null -> not admin
    const adminCheck = buildSelectChain({ data: null, error: null })
    supabase.from.mockImplementation((table) => {
      if (table === 'admin_users') return adminCheck
      // Safe defaults for any incidental selects
      return {
        select: jest.fn(() => ({
          order: jest.fn(async () => ({ data: [], error: null })),
        })),
      }
    })

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    await screen.findByLabelText(/Courses/i)
    expect(screen.getByLabelText(/Dashboard/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Admin/i)).toBeNull()
  })

  test('Authenticated admin sees Admin link after check completes', async () => {
    const session = { user: { id: 'admin-abc' } }
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    // admin_users check returns a row -> admin
    const adminCheck = buildSelectChain({ data: { id: 'admin-abc' }, error: null })
    supabase.from.mockImplementation((table) => {
      if (table === 'admin_users') return adminCheck
      return {
        select: jest.fn(() => ({
          order: jest.fn(async () => ({ data: [], error: null })),
        })),
      }
    })

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    await screen.findByLabelText(/Courses/i)
    await waitFor(() => {
      expect(screen.getByLabelText(/Admin/i)).toBeInTheDocument()
    })
  })
})

import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

// Use module factory to control supabase per test
import { buildSelectChain, makeSupabaseMock } from '../testUtils/supabaseMock'

// Helper to swap supabase mock
jest.mock('../supabaseClient', () => {
  const { makeSupabaseMock } = require('../testUtils/supabaseMock')
  const supabase = makeSupabaseMock()
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

describe('AdminRoute', () => {
  const { supabase } = require('../supabaseClient')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('redirects unauthenticated user to /auth', async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>
    )

    // Wait for redirect to auth page content "Sign in" button present
    await screen.findByText(/Sign in/i)
  })

  test('authenticated but not admin -> redirects to "/" (Home)', async () => {
    const fakeSession = { user: { id: 'user-1' } }
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: fakeSession }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    // admin_users select eq(id, user-1) maybeSingle returns null -> not admin
    const adminCheckChain = buildSelectChain({ data: null, error: null })
    supabase.from.mockImplementation((table) => {
      if (table === 'admin_users') return adminCheckChain
      return {
        select: jest.fn(() => ({ order: jest.fn(async () => ({ data: [], error: null })) })),
      }
    })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>
    )

    // Expect to land on Home page text
    await screen.findByText(/Welcome to Ocean LMS/i)
  })

  test('authenticated admin -> allows access and shows Admin dashboard links', async () => {
    const fakeSession = { user: { id: 'admin-1' } }
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: fakeSession }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    const adminCheckChain = buildSelectChain({ data: { id: 'admin-1' }, error: null })
    const coursesListChain = {
      select: jest.fn(() => ({
        order: jest.fn(async () => ({ data: [], error: null })),
      })),
    }
    supabase.from.mockImplementation((table) => {
      if (table === 'admin_users') return adminCheckChain
      if (table === 'courses') return coursesListChain
      return coursesListChain
    })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(async () => {
      expect(await screen.findByText(/Create Course/i)).toBeInTheDocument()
      expect(screen.getByText(/Create Assignment/i)).toBeInTheDocument()
    })
  })
})

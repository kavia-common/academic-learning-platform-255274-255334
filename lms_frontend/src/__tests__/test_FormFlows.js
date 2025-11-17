import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { buildSelectChain } from '../testUtils/supabaseMock'

jest.mock('../supabaseClient', () => {
  const { makeSupabaseMock } = require('../testUtils/supabaseMock')
  const supabase = makeSupabaseMock({ authSession: { user: { id: 'admin-1' } } })
  return {
    supabase,
    authApi: {
      signOut: jest.fn(async () => ({ error: null })),
    },
  }
})

describe('Form flows for CreateCourse, CreateAssignment, and SubmitAssignment', () => {
  const { supabase } = require('../supabaseClient')

  beforeEach(() => {
    jest.clearAllMocks()
    // Default admin check success
    const adminCheckChain = buildSelectChain({ data: { id: 'admin-1' }, error: null })
    const coursesListChain = {
      select: jest.fn(() => ({
        order: jest.fn(async () => ({ data: [], error: null })),
      })),
    }
    supabase.from.mockImplementation((table) => {
      if (table === 'admin_users') return adminCheckChain
      if (table === 'courses') return coursesListChain
      if (table === 'assignments') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(async () => ({ data: { id: 'a1', title: 'A1' }, error: null })),
            })),
            order: jest.fn(async () => ({ data: [], error: null })),
          })),
          insert: jest.fn(async () => ({ data: {}, error: null })),
        }
      }
      if (table === 'submissions') {
        return { insert: jest.fn(async () => ({ data: {}, error: null })) }
      }
      return { select: jest.fn(() => ({ order: jest.fn(async () => ({ data: [], error: null })) })) }
    })
  })

  test('CreateCourse success: navigates back to /admin', async () => {
    // For CreateCourse insert success
    const insertSpy = jest.fn(async () => ({ data: {}, error: null }))
    supabase.from.mockImplementation((table) => {
      if (table === 'admin_users') return buildSelectChain({ data: { id: 'admin-1' }, error: null })
      if (table === 'courses') return { insert: insertSpy, select: jest.fn(() => ({ order: jest.fn(async () => ({ data: [], error: null })) })) }
      return { select: jest.fn(() => ({ order: jest.fn(async () => ({ data: [], error: null })) })) }
    })

    render(
      <MemoryRouter initialEntries={['/admin/courses/new']}>
        <App />
      </MemoryRouter>
    )

    // Fill fields
    const titleInput = await screen.findByLabelText(/Title/i)
    fireEvent.change(titleInput, { target: { value: 'Course X' } })
    const descInput = screen.getByLabelText(/Description/i)
    fireEvent.change(descInput, { target: { value: 'Desc' } })
    const videoInput = screen.getByLabelText(/Video URL/i)
    fireEvent.change(videoInput, { target: { value: 'https://youtu.be/xyz' } })

    // Submit
    const saveBtn = screen.getByRole('button', { name: /Save/i })
    fireEvent.click(saveBtn)

    await waitFor(async () => {
      // Back to admin page content "All Courses"
      expect(await screen.findByText(/All Courses/i)).toBeInTheDocument()
    })
    expect(insertSpy).toHaveBeenCalled()
  })

  test('CreateCourse error: shows error message', async () => {
    const errorInsert = jest.fn(async () => ({ data: null, error: { message: 'fail' } }))
    supabase.from.mockImplementation((table) => {
      if (table === 'admin_users') return buildSelectChain({ data: { id: 'admin-1' }, error: null })
      if (table === 'courses') return { insert: errorInsert, select: jest.fn(() => ({ order: jest.fn(async () => ({ data: [], error: null })) })) }
      return { select: jest.fn(() => ({ order: jest.fn(async () => ({ data: [], error: null })) })) }
    })

    render(
      <MemoryRouter initialEntries={['/admin/courses/new']}>
        <App />
      </MemoryRouter>
    )

    fireEvent.change(await screen.findByLabelText(/Title/i), { target: { value: 'Course Y' } })
    const saveBtn = screen.getByRole('button', { name: /Save/i })
    fireEvent.click(saveBtn)
    await screen.findByText(/Failed to create course/i)
  })

  test('CreateAssignment success: navigates back to /admin', async () => {
    // Mock courses select for dropdown
    const coursesSelect = {
      select: jest.fn(() => ({
        order: jest.fn(async () => ({ data: [{ id: 'c1', title: 'C1' }], error: null })),
      })),
    }
    const assignmentInsert = { insert: jest.fn(async () => ({ data: {}, error: null })) }

    supabase.from.mockImplementation((table) => {
      if (table === 'admin_users') return buildSelectChain({ data: { id: 'admin-1' }, error: null })
      if (table === 'courses') return coursesSelect
      if (table === 'assignments') return assignmentInsert
      return { select: jest.fn(() => ({ order: jest.fn(async () => ({ data: [], error: null })) })) }
    })

    render(
      <MemoryRouter initialEntries={['/admin/assignments/new']}>
        <App />
      </MemoryRouter>
    )

    // Select course
    const courseSelect = await screen.findByLabelText(/Course/i)
    fireEvent.change(courseSelect, { target: { value: 'c1' } })
    // Fill title
    fireEvent.change(screen.getByLabelText(/^Title$/i), { target: { value: 'A1' } })

    const saveBtn = screen.getByRole('button', { name: /Save/i })
    fireEvent.click(saveBtn)

    await screen.findByText(/All Courses/i)
    expect(assignmentInsert.insert).toHaveBeenCalled()
  })

  test('CreateAssignment error: shows error message', async () => {
    const coursesSelect = {
      select: jest.fn(() => ({
        order: jest.fn(async () => ({ data: [{ id: 'c1', title: 'C1' }], error: null })),
      })),
    }
    const assignmentInsert = { insert: jest.fn(async () => ({ data: null, error: { message: 'nope' } })) }

    supabase.from.mockImplementation((table) => {
      if (table === 'admin_users') return buildSelectChain({ data: { id: 'admin-1' }, error: null })
      if (table === 'courses') return coursesSelect
      if (table === 'assignments') return assignmentInsert
      return { select: jest.fn(() => ({ order: jest.fn(async () => ({ data: [], error: null })) })) }
    })

    render(
      <MemoryRouter initialEntries={['/admin/assignments/new']}>
        <App />
      </MemoryRouter>
    )

    const courseSelect = await screen.findByLabelText(/Course/i)
    fireEvent.change(courseSelect, { target: { value: 'c1' } })
    fireEvent.change(screen.getByLabelText(/^Title$/i), { target: { value: 'A1' } })

    fireEvent.click(screen.getByRole('button', { name: /Save/i }))
    await screen.findByText(/Failed to create assignment/i)
  })

  test('SubmitAssignment success and error flows', async () => {
    // Make user authenticated (non-admin path used in ProtectedRoute)
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-2' } } } })

    // View assignment detail then submit
    supabase.from.mockImplementation((table) => {
      if (table === 'assignments') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(async () => ({ data: { id: 'a1', title: 'A1' }, error: null })),
            })),
          })),
        }
      }
      if (table === 'submissions') {
        return { insert: jest.fn(async () => ({ data: {}, error: null })) }
      }
      if (table === 'admin_users') {
        return buildSelectChain({ data: { id: 'admin-1' }, error: null })
      }
      if (table === 'courses') {
        return { select: jest.fn(() => ({ order: jest.fn(async () => ({ data: [], error: null })) })) }
      }
      return { select: jest.fn(() => ({ order: jest.fn(async () => ({ data: [], error: null })) })) }
    })

    // Success path
    render(
      <MemoryRouter initialEntries={['/assignments/a1/submit']}>
        <App />
      </MemoryRouter>
    )

    const notes = await screen.findByLabelText(/Content \/ Notes/i)
    fireEvent.change(notes, { target: { value: 'My work' } })
    fireEvent.click(screen.getByRole('button', { name: /Save/i }))
    await screen.findByText(/Available Courses/i) // redirected to Dashboard

    // Error path: re-render with failing insert
    const insertFail = jest.fn(async () => ({ data: null, error: { message: 'fail' } }))
    supabase.from.mockImplementation((table) => {
      if (table === 'assignments') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(async () => ({ data: { id: 'a1', title: 'A1' }, error: null })),
            })),
          })),
        }
      }
      if (table === 'submissions') {
        return { insert: insertFail }
      }
      return { select: jest.fn(() => ({ order: jest.fn(async () => ({ data: [], error: null })) })) }
    })

    render(
      <MemoryRouter initialEntries={['/assignments/a1/submit']}>
        <App />
      </MemoryRouter>
    )

    const notes2 = await screen.findByLabelText(/Content \/ Notes/i)
    fireEvent.change(notes2, { target: { value: 'Try again' } })
    fireEvent.click(screen.getByRole('button', { name: /Save/i }))
    await screen.findByText(/Failed to submit assignment/i)
  })
})

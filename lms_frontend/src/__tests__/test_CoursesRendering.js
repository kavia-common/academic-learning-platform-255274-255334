import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

jest.mock('../supabaseClient', () => {
  const { makeSupabaseMock } = require('../testUtils/supabaseMock')
  const supabase = makeSupabaseMock()
  return {
    supabase,
    authApi: {},
  }
})

describe('Courses and CourseDetails rendering', () => {
  const { supabase } = require('../supabaseClient')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Courses list renders items', async () => {
    supabase.from.mockImplementation((table) => {
      if (table === 'courses') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(async () => ({
              data: [
                { id: 'c1', title: 'Course 1', description: 'Desc 1' },
                { id: 'c2', title: 'Course 2', description: 'Desc 2' },
              ],
              error: null,
            })),
          })),
        }
      }
      return { select: jest.fn(() => ({ order: jest.fn(async () => ({ data: [], error: null })) })) }
    })

    render(
      <MemoryRouter initialEntries={['/courses']}>
        <App />
      </MemoryRouter>
    )

    expect(await screen.findByText(/Course 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Course 2/i)).toBeInTheDocument()
  })

  test('CourseDetails shows course and assignments', async () => {
    supabase.from.mockImplementation((table) => {
      if (table === 'courses') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(async () => ({
                data: { id: 'c1', title: 'Course 1', description: 'Desc 1', video_url: '' },
                error: null,
              })),
            })),
          })),
        }
      }
      if (table === 'assignments') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(async () => ({
                data: [{ id: 'a1', course_id: 'c1', title: 'Assignment A', description: 'Do A' }],
                error: null,
              })),
            })),
            order: jest.fn(async () => ({ data: [], error: null })),
          })),
        }
      }
      return { select: jest.fn(() => ({ order: jest.fn(async () => ({ data: [], error: null })) })) }
    })

    render(
      <MemoryRouter initialEntries={['/courses/c1']}>
        <App />
      </MemoryRouter>
    )

    expect(await screen.findByText(/Course 1/i)).toBeInTheDocument()
    expect(await screen.findByText(/Assignment A/i)).toBeInTheDocument()
  })
})

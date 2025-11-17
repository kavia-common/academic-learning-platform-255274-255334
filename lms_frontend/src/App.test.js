import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

jest.mock('./supabaseClient', () => {
  const { makeSupabaseMock } = require('./testUtils/supabaseMock')
  const supabase = makeSupabaseMock()
  return {
    supabase,
    authApi: {},
  }
})

test('renders main navigation including Courses link', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  )
  expect(screen.getByLabelText(/Courses/i)).toBeInTheDocument()
})

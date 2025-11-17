import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

test('renders Courses link', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  )
  const linkElement = screen.getByText(/Courses/i)
  expect(linkElement).toBeInTheDocument()
})

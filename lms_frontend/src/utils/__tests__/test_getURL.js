import { getURL } from '../getURL'

describe('getURL precedence and formatting', () => {
  const OLD_ENV = process.env
  const originalOrigin = (typeof window !== 'undefined' && window.location && window.location.origin) || 'http://localhost:3000'

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
    // Reset VITE_ and REACT_APP_ for each test
    delete process.env.VITE_SITE_URL
    delete process.env.REACT_APP_FRONTEND_URL
    delete process.env.REACT_APP_SITE_URL

    // Ensure default origin
    if (typeof window !== 'undefined') {
      Object.defineProperty(window.location, 'origin', {
        configurable: true,
        value: originalOrigin,
      })
    }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  test('uses VITE_SITE_URL if set and adds trailing slash', () => {
    process.env.VITE_SITE_URL = 'https://example.com'
    expect(getURL()).toBe('https://example.com/')
  })

  test('falls back to REACT_APP_FRONTEND_URL when VITE_SITE_URL missing', () => {
    process.env.REACT_APP_FRONTEND_URL = 'https://frontend.example'
    expect(getURL()).toBe('https://frontend.example/')
  })

  test('falls back to REACT_APP_SITE_URL then window.location.origin', () => {
    process.env.REACT_APP_SITE_URL = 'app.example'
    expect(getURL()).toBe('https://app.example/')
  })

  test('adds protocol if missing and ensures trailing slash', () => {
    process.env.VITE_SITE_URL = 'mydomain.com'
    expect(getURL()).toBe('https://mydomain.com/')
  })

  test('defaults to window.location.origin if no envs', () => {
    if (typeof window !== 'undefined') {
      Object.defineProperty(window.location, 'origin', {
        configurable: true,
        value: 'http://local.test:4000',
      })
    }
    expect(getURL()).toBe('http://local.test:4000/')
  })

  test('final fallback to http://localhost:3000/', () => {
    if (typeof window !== 'undefined') {
      Object.defineProperty(window.location, 'origin', {
        configurable: true,
        value: undefined,
      })
    }
    expect(getURL()).toBe('http://localhost:3000/')
  })
})

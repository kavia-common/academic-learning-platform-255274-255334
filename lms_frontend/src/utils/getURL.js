export const getURL = () => {
  // Use CRA-style var if provided; else fall back to window.location.origin; finally localhost.
  let url =
    process.env.REACT_APP_FRONTEND_URL ||
    process.env.REACT_APP_SITE_URL ||
    (typeof window !== 'undefined' && window.location && window.location.origin) ||
    'http://localhost:3000'

  if (!String(url).startsWith('http')) {
    url = `https://${url}`
  }
  if (!String(url).endsWith('/')) {
    url = `${url}/`
  }
  return url
}

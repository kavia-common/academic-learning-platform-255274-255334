export const getURL = () => {
  let url =
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SITE_URL)) ||
    process.env.VITE_SITE_URL ||
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

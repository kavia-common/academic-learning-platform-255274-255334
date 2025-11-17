import { createClient } from '@supabase/supabase-js'
import { getURL } from './utils/getURL'

/**
 * Supabase client initialization with dual env support (Vite and CRA).
 *
 * Precedence (URL):
 * 1) import.meta.env.VITE_SUPABASE_URL
 * 2) process.env.VITE_SUPABASE_URL
 * 3) process.env.REACT_APP_SUPABASE_URL
 * 4) process.env.REACT_APP_API_BASE
 * 5) process.env.REACT_APP_BACKEND_URL
 *
 * Precedence (Anon Key):
 * 1) import.meta.env.VITE_SUPABASE_ANON_KEY
 * 2) process.env.VITE_SUPABASE_ANON_KEY
 * 3) process.env.REACT_APP_SUPABASE_ANON_KEY
 *
 * Notes:
 * - We never log actual secrets.
 * - Provide concise guidance if required values are missing.
 */
const viteEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {}

const supabaseUrl =
  viteEnv?.VITE_SUPABASE_URL ||
  process.env?.VITE_SUPABASE_URL ||
  process.env?.REACT_APP_SUPABASE_URL ||
  process.env?.REACT_APP_API_BASE ||
  process.env?.REACT_APP_BACKEND_URL

const supabaseAnonKey =
  viteEnv?.VITE_SUPABASE_ANON_KEY ||
  process.env?.VITE_SUPABASE_ANON_KEY ||
  process.env?.REACT_APP_SUPABASE_ANON_KEY

// Validation and helpful messaging without leaking secrets
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = []
  if (!supabaseUrl) missing.push('Supabase URL')
  if (!supabaseAnonKey) missing.push('Supabase anon key')

  // eslint-disable-next-line no-console
  console.error(
    `Missing required ${missing.join(' and ')}. Set VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY (preferred) ` +
    `or CRA fallbacks REACT_APP_SUPABASE_URL/REACT_APP_SUPABASE_ANON_KEY.`
  )
  // Provide an actionable hint without secrets
  // eslint-disable-next-line no-console
  console.error(
    'Tip: update your .env and restart the dev server or preview environment after changes.'
  )
  throw new Error('Supabase configuration is incomplete. See console for setup guidance.')
}

// PUBLIC_INTERFACE
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * PUBLIC_INTERFACE
 * High-level Auth API helpers with redirect handling.
 */
export const authApi = {
  /**
   * Sign up user with email/password. Sends confirmation email with redirect back to /auth/callback
   */
  signUp: async (email, password) =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getURL()}auth/callback`,
      },
    }),

  /**
   * Sign in via password
   */
  signInWithPassword: async (email, password) =>
    supabase.auth.signInWithPassword({ email, password }),

  /**
   * Send password reset email
   */
  resetPassword: async (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getURL()}auth/reset-password`,
    }),

  /**
   * Magic link sign-in
   */
  signInWithMagicLink: async (email) =>
    supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${getURL()}auth/callback` },
    }),

  /**
   * OAuth sign-in
   */
  signInWithOAuth: async (provider) =>
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${getURL()}auth/callback` },
    }),

  /**
   * Sign out
   */
  signOut: async () => supabase.auth.signOut(),
}

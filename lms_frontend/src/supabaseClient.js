import { createClient } from '@supabase/supabase-js'
import { getURL } from './utils/getURL'

/**
 * Supabase client initialization using CRA-style env vars only.
 *
 * Required:
 * - REACT_APP_SUPABASE_URL: Supabase project URL
 * - REACT_APP_SUPABASE_ANON_KEY: Supabase anon/public key (never service_role)
 *
 * Notes:
 * - Never log secrets.
 * - Provide clear guidance if values are missing (without printing the values).
 */
const supabaseUrl = process.env?.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env?.REACT_APP_SUPABASE_ANON_KEY

// Validation and concise, non-secret warnings
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = []
  if (!supabaseUrl) missing.push('REACT_APP_SUPABASE_URL')
  if (!supabaseAnonKey) missing.push('REACT_APP_SUPABASE_ANON_KEY')

  // eslint-disable-next-line no-console
  console.error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
      'Set them in lms_frontend/.env and restart the dev server.'
  )
  throw new Error('Supabase configuration is incomplete. Check .env for required variables.')
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

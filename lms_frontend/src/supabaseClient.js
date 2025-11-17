import { createClient } from '@supabase/supabase-js'
import { getURL } from './utils/getURL'

/**
 * Supabase client initialization.
 *
 * Required env vars (Vite style):
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 *
 * Note:
 * If you are still using CRA, ensure your build tooling supports exposing VITE_* variables,
 * or migrate your variables to Vite prefix. This file expects Vite-style variables.
 */
const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey =
  import.meta?.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

// Basic validation to avoid silent failures (do not log secrets)
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
  )
}

// PUBLIC_INTERFACE
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

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
        // Use SITE URL derived from getURL()
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

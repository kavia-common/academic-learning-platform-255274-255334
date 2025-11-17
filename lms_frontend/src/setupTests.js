/* eslint-disable no-undef */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Provide a simple fetch mock for environments that lack it in tests.
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({}),
      text: async () => '',
    })
  );
}

// Mock window.location.origin in jsdom if needed
if (typeof window !== 'undefined' && !window.location.origin) {
  // jsdom provides a location object but origin may be undefined in some envs
  Object.defineProperty(window.location, 'origin', {
    configurable: true,
    value: 'http://localhost:3000',
  });
}

// Default mock for supabase client. Individual tests can override implementations.
jest.mock('./supabaseClient', () => {
  const { makeSupabaseMock } = require('./testUtils/supabaseMock');
  const supabaseDefault = makeSupabaseMock({ authSession: null });
  return {
    supabase: supabaseDefault,
    authApi: {
      signUp: jest.fn(async () => ({ data: {}, error: null })),
      signInWithPassword: jest.fn(async () => ({ data: {}, error: null })),
      resetPassword: jest.fn(async () => ({ data: {}, error: null })),
      signInWithMagicLink: jest.fn(async () => ({ data: {}, error: null })),
      signInWithOAuth: jest.fn(async () => ({ data: {}, error: null })),
      signOut: jest.fn(async () => ({ error: null })),
    },
  };
});

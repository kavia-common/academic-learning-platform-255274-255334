export const buildSelectChain = (result = { data: null, error: null }) => {
  // Mocks the supabase.from('table').select(...).eq(...).maybeSingle()/order() chain
  const chain = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    order: jest.fn(() => chain),
    maybeSingle: jest.fn(async () => result),
  };
  // Also allow direct select() terminal returns for simple .select() case
  chain.select.mockImplementation((..._args) => {
    return chain;
  });
  // When tests call .select() and await directly (without maybeSingle), return result
  chain.then = undefined; // not a thenable
  chain._result = result;
  chain._resolve = async () => result;
  return chain;
};

export const buildInsertChain = (result = { data: null, error: null }) => {
  const chain = {
    insert: jest.fn(async () => result),
  };
  return chain;
};

export const makeSupabaseAuthMock = (session = null) => {
  const getSession = jest.fn(async () => ({ data: { session }, error: null }));
  const onAuthStateChange = jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  }));
  const signOut = jest.fn(async () => ({ error: null }));
  const updateUser = jest.fn(async () => ({ data: {}, error: null }));
  const resetPasswordForEmail = jest.fn(async () => ({ data: {}, error: null }));
  const signInWithOtp = jest.fn(async () => ({ data: {}, error: null }));
  const signInWithPassword = jest.fn(async () => ({ data: {}, error: null }));
  const signUp = jest.fn(async () => ({ data: {}, error: null }));
  const signInWithOAuth = jest.fn(async () => ({ data: {}, error: null }));

  return {
    getSession,
    onAuthStateChange,
    signOut,
    updateUser,
    resetPasswordForEmail,
    signInWithOtp,
    signInWithPassword,
    signUp,
    signInWithOAuth,
  };
};

export const makeSupabaseMock = ({ authSession = null } = {}) => {
  const auth = makeSupabaseAuthMock(authSession);
  const from = jest.fn((_table) => {
    // Each test can override supabase.from.mockImplementationOnce to return custom chains.
    // Provide a default empty chain to avoid crashes.
    return {
      select: jest.fn(() => ({
        order: jest.fn(async () => ({ data: [], error: null })),
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(async () => ({ data: null, error: null })),
        })),
        maybeSingle: jest.fn(async () => ({ data: null, error: null })),
      })),
      insert: jest.fn(async () => ({ data: null, error: null })),
    };
  });
  return { auth, from };
};

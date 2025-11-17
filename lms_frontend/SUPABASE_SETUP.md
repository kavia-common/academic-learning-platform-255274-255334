# Supabase Setup (Frontend)

1) Copy .env.example to .env and set values:
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY (anon/public; do not use service_role)
- Optionally REACT_APP_FRONTEND_URL (fallback uses window.location.origin)

2) In Supabase Dashboard:
- Authentication > URL Configuration:
  - Site URL: your frontend URL (e.g., http://localhost:3000)
  - Additional Redirect URLs: http://localhost:3000/** and your production domain /**

3) Use the client:
- import { supabase, authApi } from './src/supabaseClient'

4) Routes:
- /auth for sign-in (magic link/password)
- /signin for direct email/password sign in (src/pages/SignIn.jsx)
- /signup for email/password registration with role selection (src/pages/SignUp.jsx)
- /auth/callback mounts src/components/AuthCallback.js
- /auth/reset-password handles both requesting a reset email and finishing recovery (type=recovery)
- Protected pages: /dashboard, /assignments/:id/submit
- Admin pages (require admin_users row): /admin, /admin/courses/new, /admin/assignments/new

Security:
- Do not log secrets.
- Do not commit real keys to source control.
- Only use anon key on client.

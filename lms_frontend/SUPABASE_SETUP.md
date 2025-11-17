# Supabase Setup (Frontend)

1) Copy .env.example to .env and set values:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY (anon/public; do not use service_role)
- Optionally VITE_SITE_URL (fallback uses window.location.origin)

2) In Supabase Dashboard:
- Authentication > URL Configuration:
  - Site URL: your frontend URL (e.g., http://localhost:3000)
  - Additional Redirect URLs: http://localhost:3000/** and your production domain /**

3) Use the client:
- import { supabase, authApi } from './src/supabaseClient'

4) Routes:
- /auth for sign-in (magic link/password)
- /auth/callback mounts src/components/AuthCallback.js
- Protected pages: /dashboard, /assignments/:id/submit
- Admin pages (require admin_users row): /admin, /admin/courses/new, /admin/assignments/new

Security:
- Do not log secrets.
- Do not commit real keys to source control.
- Only use anon key on client.

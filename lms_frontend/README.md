# Ocean LMS Frontend (React + Supabase)

Minimal LMS frontend with Supabase auth and basic LMS features.

## Features
- Magic link and password sign-in via Supabase
- Protected routes and admin gating (`admin_users` table)
- Courses list and course details with assignments
- Create Course and Create Assignment (admin)
- Employee Dashboard with submissions
- Submit Assignment flow
- Graceful loading/error states
- Single Supabase client at `src/supabaseClient.js` using CRA `REACT_APP_*` envs

## Environment Variables (CRA)

Create a `.env` file with the following variables:

- REACT_APP_SUPABASE_URL: Your Supabase project URL (https://xyzcompany.supabase.co)
- REACT_APP_SUPABASE_ANON_KEY: Your Supabase anon/public key (never service_role)
- REACT_APP_FRONTEND_URL (optional): Explicit site URL for auth redirects (defaults to window.location.origin)

These are read in `src/supabaseClient.js` and `src/utils/getURL.js`.

## Local Setup

1) Install dependencies:
- npm install

2) Configure environment:
- Copy `.env.example` to `.env`
- Fill `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
- Optionally set `REACT_APP_FRONTEND_URL` to `http://localhost:3000`

3) Supabase Authentication redirects:
- In Supabase Dashboard → Authentication → URL Configuration:
  - Site URL: http://localhost:3000
  - Additional Redirect URLs:
    - http://localhost:3000/auth/callback
    - http://localhost:3000/auth/reset-password

4) Database schema and RLS:
- Open Supabase SQL Editor and run assets/supabase.sql
- Then run assets/supabase_policies.sql
- Bootstrap first admin user (see Admin Bootstrap below)

5) Start the app:
- npm start → http://localhost:3000

## Production Setup

1) Build and host the frontend:
- npm run build
- Deploy the `build/` output to your hosting provider (e.g., Vercel, Netlify, S3 + CloudFront, or your own server)

2) Environment variables:
- Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your hosting environment
- Optionally set REACT_APP_FRONTEND_URL to your production origin, e.g., https://yourdomain.com

3) Supabase Authentication redirects (Production):
- In Supabase Dashboard → Authentication → URL Configuration:
  - Site URL: https://yourdomain.com
  - Additional Redirect URLs:
    - https://yourdomain.com/auth/callback
    - https://yourdomain.com/auth/reset-password

4) Database and RLS:
- Ensure the same SQL from assets/supabase.sql and assets/supabase_policies.sql has been applied (via migrations or SQL Editor)
- Ensure an admin user is present in public.admin_users

## Admin Bootstrap

Insert your first admin manually via SQL (replace with your auth user UUID):

```sql
INSERT INTO public.admin_users (id, role)
VALUES ('<your-auth-user-id>', 'admin');
```

Find your auth user ID in Supabase Dashboard → Authentication → Users.

## Routes

- `/` Home
- `/auth` Sign-in (magic link/password)
- `/auth/callback` Auth redirect handler
- `/auth/reset-password` Password reset request and recovery
- `/signup` Email/password sign up with role selection (student|admin)
- `/signin` Email/password sign in
- `/courses` List courses
- `/courses/:id` Course details + assignments
- `/assignments/:id` Assignment details
- `/assignments/:id/submit` Submit assignment (protected)
- `/dashboard` Employee dashboard (protected)
- `/admin` Admin dashboard (admin only)
- `/admin/courses/new` Create course (admin)
- `/admin/assignments/new` Create assignment (admin)

## Quick-Start Checklist

- [ ] Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in `.env` (see `.env.example`)
- [ ] Configure Supabase Auth redirects for local or production
  - Add http://localhost:3000/auth/callback, http://localhost:3000/auth/reset-password, and http://localhost:3000
- [ ] Apply database schema: run assets/supabase.sql
- [ ] Apply RLS policies: run assets/supabase_policies.sql
- [ ] (Optional) Create run_sql RPC if you want automated schema checks (see assets/supabase.md)
- [ ] Insert first admin into public.admin_users
- [ ] Start app and sign in
- [ ] Verify admin can create course and assignment; student can submit; password reset flow works

## Security

- Only use anon key on the client; never use service_role in the frontend
- Do not commit real secrets
- Ensure Supabase Authentication URL settings include localhost and production domains

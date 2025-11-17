# Ocean LMS Frontend (React + Supabase)

Minimal LMS frontend with Supabase auth and basic LMS features.

## Features
- Magic link and password sign-in via Supabase
- Protected routes and admin gating via the `admin_users` table
- Courses list and course details with assignments
- Create Course and Create Assignment (admin-only)
- Employee Dashboard with submissions
- Submit Assignment flow
- Graceful loading/error states
- Single Supabase client at `src/supabaseClient.js` using CRA `REACT_APP_*` envs

## Admin link visibility

The Admin nav link and all `/admin` routes are visible and accessible only when the currently authenticated user has a row in `public.admin_users` with `id = auth.users.id`. If the row is not present, the Admin link is hidden and direct navigation to admin routes will redirect away. This behavior is enforced in:
- Navbar (Admin link rendered only when `admin_users` contains the current user)
- AdminRoute guard (redirects non-admin users)

To enable the first admin, insert the authenticated user’s UUID into `public.admin_users` as shown in Admin Bootstrap.

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

After your first signup, insert your user as an admin so the Admin link appears:

```sql
INSERT INTO public.admin_users (id, role)
VALUES ('<your-auth-user-id>', 'admin');
```

Replace `<your-auth-user-id>` with the UUID from Supabase Dashboard → Authentication → Users. The Admin link becomes visible only for users present in `public.admin_users`.

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

## Verification Checklist

- [ ] Environment variables set in `.env`:
  - [ ] REACT_APP_SUPABASE_URL
  - [ ] REACT_APP_SUPABASE_ANON_KEY
  - [ ] (Optional) REACT_APP_FRONTEND_URL
- [ ] Supabase Authentication redirects configured:
  - `http://localhost:3000`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/reset-password`
- [ ] Database schema applied: run `assets/supabase.sql`
- [ ] RLS policies applied: run `assets/supabase_policies.sql`
- [ ] Admin bootstrap: insert a row for your user in `public.admin_users`
- [ ] Owner fields on inserts:
  - Courses: `owner_id` set to `auth.uid()` on insert
  - Assignments: `created_by` set to `auth.uid()` on insert
  - Submissions: `student_id` set to `auth.uid()` on insert
- [ ] Auth redirects verified:
  - Magic link/OAuth → `/auth/callback` lands on Dashboard when session is present
  - Password reset request and recovery (`/auth/reset-password`) work end-to-end

## Security

- Only use anon key on the client; never use service_role in the frontend
- Do not commit real secrets
- Ensure Supabase Authentication URL settings include localhost and production domains

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
- Single Supabase client at `src/supabaseClient.js` using `VITE_*` envs

## Environment
Copy `.env.example` to `.env` and set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Optional: `VITE_SITE_URL` for redirect base (otherwise uses `window.location.origin`)

## Routes
- `/` Home
- `/auth` Sign-in (magic link/password)
- `/auth/callback` Auth redirect handler
- `/courses` List courses
- `/courses/:id` Course details + assignments
- `/assignments/:id` Assignment details
- `/assignments/:id/submit` Submit assignment (protected)
- `/dashboard` Employee dashboard (protected)
- `/admin` Admin dashboard (admin only)
- `/admin/courses/new` Create course (admin)
- `/admin/assignments/new` Create assignment (admin)

## Development
- `npm install`
- `npm start` → http://localhost:3000

Security:
- No secrets in code.
- Use anon key only on client.
- Ensure Supabase Authentication URL settings include localhost and production domains.

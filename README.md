# Fullstack Developer Test

- Check this readme.md
- Create a branch to develop your task
- Push to remote in 1 week (date will be checked from branch creation/assigned date)

# Requirements:
- Latest version of the stack
- Write unit and integration tests 
- Deliver with a working Dockerfile
- Use docker-compose.yml if needed
- Show your best practices ex: design patters, linters etc.

# The Test
Here we'll try to simulate a "real sprint" that you'll, probably, be assigned while working as Fullstack at Umanni.
# The Task
- Create a responsive application to manage users.
- A user must have:
1- full_name
2- email
3- avatar_image (upload from file or url)
# Users Manager — Fullstack Developer Test

This repository contains a Rails backend (API) and a React + TypeScript frontend. It implements a responsive user management application matching the test requirements (user CRUD, import CSV/XLSX with progress, realtime admin counters, avatar upload by file or URL, roles with admin/user, JWT authentication via Devise, etc.).

This README explains how the project maps to the requirements and provides step-by-step instructions to build, run and test the application (development and via Docker).

## Quick summary — what is implemented

- Authentication: Devise + devise-jwt for API authentication (JWT). First created user becomes an admin.
- Roles: `admin` and `user` with Pundit policies restricting actions (admin-only dashboard and management).
- Avatar: file upload (ActiveStorage) and download-from-URL (backend service). Avatar variants are generated and optimized.
- Admin dashboard: real-time stats via ActionCable (`admin_stats` channel) showing total users and counts by role.
- Import: bulk CSV / Excel import (`UserImport` model + `UserImportJob`) with realtime progress updates via ActionCable (`admin_imports` and `import_<id>` channels). Supports uploading a file or passing a remote URL (download job).
- Frontend: React + TypeScript + Vite, SCSS files, form validation and components for login, register, profile, admin users, import page. ActionCable client connects via `@rails/actioncable`.
- Docker: `docker-compose.yml` plus `backend/Dockerfile` and `frontend/Dockerfile` to run the full stack locally.

## Requirements mapping

All of the requirements from the test are implemented or scaffolded in this project. Highlights:

- Full user model with `full_name`, `email`, `avatar` (file or URL) and `role` (`admin` / `user`) — `backend/app/models/user.rb`.
- Authentication using Devise + JWT — `backend/Gemfile`, `backend/app/models/user.rb`, `backend/app/controllers/api/v1/sessions_controller.rb`.
- Admin dashboard with realtime counters — `backend/app/channels/admin_stats_channel.rb`, `backend/app/services/stats_broadcast_service.rb`, `frontend/src/pages/admin/Dashboard.tsx`.
- User CRUD and role toggle endpoints — `backend/app/controllers/api/v1/users_controller.rb` with Pundit `backend/app/policies/user_policy.rb` and frontend pages under `frontend/src/pages/admin/`.
- Bulk import with progress — `backend/app/models/user_import.rb`, `backend/app/jobs/user_import_job.rb`, `backend/app/channels/imports_channel.rb`, `backend/app/services/import_broadcast_service.rb`, frontend `frontend/src/pages/admin/ImportPage.tsx`.
- Avatar upload and URL import — `has_one_attached :avatar`, `backend/app/services/avatar_from_url_service.rb`, `backend/app/jobs/avatar_processing_job.rb`, frontend profile and user forms accept file or URL.

## Tech stack

- Backend: Ruby on Rails (API), PostgreSQL, ActiveStorage, Sidekiq/SolidQueue style jobs (configured via `bin/jobs`), Pundit for authorization, Devise + devise-jwt for authentication.
- Frontend: React 19 + TypeScript with Vite, SCSS for styles, `@rails/actioncable` for realtime websockets.
- Containerization: Docker and docker-compose.

## Development — prerequisites

- Docker & Docker Compose (recommended for full-stack dev): Docker Engine >= 20.x, docker-compose v2.
- Alternatively, local installs:
  - Ruby 3.4.x, Bundler
  - Node 20.x, pnpm
  - PostgreSQL database

## Quickstart (recommended: Docker)

1. Copy credentials and environment files if needed:

   - A Rails `master.key` is included for local encrypted credentials in the repository. If you need to override credentials locally, set `RAILS_MASTER_KEY` or update `config/credentials.yml.enc` appropriately.

2. Start the full stack with docker-compose (builds backend & frontend images):

```bash
docker-compose up --build
```

3. Services exposed by default:

- Backend API: http://localhost:3001
- Frontend (Vite dev server): http://localhost:5173
- PostgreSQL: 5432 (container)

4. Create and migrate the database (if required inside the backend container):

```bash
# From project root (using docker-compose's backend service)
docker-compose run --rm backend bash -lc "bundle exec rails db:create db:migrate db:seed"
```

5. Visit the frontend and register a new user (first user will become admin). Login will redirect to `/admin/dashboard` for admins and `/profile` for regular users.

## Frontend: dev and build

If you prefer working on the frontend directly:

```bash
cd frontend
pnpm install
pnpm run dev
# build for production
pnpm run build
```

Environment variables (frontend)
- `VITE_API_URL` or `VITE_API_BASE_URL` — base URL for the API (default in docker-compose is http://localhost:3001)
- Optional: `VITE_DEV_AUTH_TOKEN` used only for dev convenience

## Backend: run locally

Install Ruby dependencies and run the server locally (without Docker):

```bash
cd backend
bundle install
bundle exec rails db:create db:migrate
bundle exec rails s -p 3001
```

To run background jobs (required to process imports and avatar processing):

```bash
# Use the provided job runner
cd backend
bin/jobs start
```

## Tests and coverage

Backend tests (RSpec):

```bash
cd backend
bundle exec rspec
```

Frontend tests (Jest / Testing Library in this repo):

```bash
cd frontend
pnpm test
```

We aim for high coverage; test files and specs live under `backend/spec` and `frontend/src/test`.

## Important API endpoints (examples)

Base API path: `/api/v1`

- POST `/api/v1/sign_up` — register (returns JWT token and user metadata)
- POST `/api/v1/sign_in` — authenticate (returns JWT token and redirect path)
- DELETE `/api/v1/sign_out` — logout
- GET `/api/v1/users` — list users (admin only)
- GET `/api/v1/users/:id` — get user
- PATCH `/api/v1/users/:id/toggle_role` — toggle role (admin only)
- GET `/api/v1/users/profile` — current user's profile
- PATCH `/api/v1/users/profile` — update current user's profile
- POST `/api/v1/user_imports` — create a bulk import (file upload or remote URL)

Note: The API is protected by JWT auth. The frontend stores the token and attaches it to requests.

## Realtime (ActionCable)

- Admin stats channel: `admin_stats` — subscribe to receive `{ type: 'stats_update', data: { total_users, admin_count, user_count, ... } }` updates.
- Import channels: `admin_imports` and `import_<id>` — broadcast import list changes and per-import progress events.

Frontend ActionCable consumer is implemented in `frontend/src/services/cable.ts`.

## Configuration and secrets

- Rails encrypted credentials are used for secrets (see `config/credentials.yml.enc` and `config/master.key`).
- Environment variables used in `docker-compose.yml`: `DATABASE_URL`, `ACTION_CABLE_URL`, `FRONTEND_URL`, `RAILS_ENV`, `VITE_DEV_AUTH_TOKEN`.

## Linting, style and best practices

- Frontend: ESLint + TypeScript rules are configured; SCSS is used for styling.
- Backend: RuboCop, RSpec; services and background jobs follow single-responsibility patterns. Pundit is used for authorization.

## Notes, assumptions and next steps

- The first created user becomes an admin to seed administration access.
- ActiveStorage uses local disk by default in development; for production configure S3 or other service in `config/storage.yml`.
- If you want me to add CI (GitHub Actions) that runs lint and tests and reports coverage, I can add a minimal workflow.
- If you need stress tests or a performance benchmark for imports, I can add a small harness that enqueues a large import and measures throughput.

## Troubleshooting

- If the frontend can't connect to ActionCable, ensure `VITE_API_URL` matches backend host and that `ACTION_CABLE_URL` (in `docker-compose`) is reachable.
- If ActiveStorage file uploads fail inside Docker, ensure the `backend` container has correct write permissions to `/app/storage` and that volumes are mounted.

## Contact / Contribution

If you have questions or want me to add features (CI, more tests, docs), tell me which area to prioritize.

---

This README was generated to document how to run and validate the Users Manager project and to map the implemented features to the original Fullstack Developer Test requirements.

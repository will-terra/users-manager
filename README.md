# Fullstack Developer Test

Important: create `.env` files
------------------------------

Before running the project, create `.env` files for both backend and frontend based on their examples. Copy or rename the provided `.env.example` files to `.env` and update any values (secrets, API URLs, etc.). Examples:

```bash
# backend
cd backend
cp .env.example .env

# frontend
cd ../frontend
cp .env.example .env
```

# Users Manager — Fullstack Developer Test

This repository contains a Rails backend (API) and a React + TypeScript frontend. It implements a responsive user management application matching the test requirements: user CRUD, import CSV with progress, realtime admin counters, avatar upload by file or URL, roles with admin/user, JWT authentication via Devise...

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

1. Start the full stack with docker-compose (builds backend & frontend images):

```bash
docker-compose up --build
```


2. Create and migrate the database (if required inside the backend container):

```bash
# From project root (using docker-compose's backend service)
docker-compose run --rm backend bundle exec rails db:migrate 
```
3. Services exposed by default:

- Backend API: http://localhost:3001
- Frontend (Vite dev server): http://localhost:5173
- PostgreSQL: 5432 (container)


4. Visit the frontend and register a new user. Note: the first user created in the application is automatically assigned the `admin` role. Login will redirect to `/admin/dashboard` for admins and `/profile` for regular users.

5. Sample CSV for import: a sample users file is included at `backend/public/users.csv`. You can import this file using the frontend Import page (Admin → Import) — either upload the file directly from your host or use the backend-served path when the backend is running (the file is available from the backend public folder).

## Frontend: dev and build

If you prefer working on the frontend directly:

```bash
cd frontend
pnpm install
pnpm run dev
# build for production
pnpm run build
```


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
<img width="642" height="222" alt="Captura de tela 2025-11-13 212329" src="https://github.com/user-attachments/assets/c3141e20-ff09-411e-9a2d-a6faea3a04f4" />


Frontend tests (Vitest)
```bash
pnpm run test:coverage
# coverage output will be placed in `frontend/coverage`
```
<img width="849" height="923" alt="Captura de tela 2025-11-13 212514" src="https://github.com/user-attachments/assets/ea937290-fbea-4eaf-91c4-a5e81e7f99f3" />


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

## Linting, style and best practices

- Frontend: ESLint + TypeScript rules are configured; SCSS is used for styling.
- Backend: RuboCop, RSpec; services and background jobs follow single-responsibility patterns. Pundit is used for authorization.

## Notes

- The first created user becomes an admin to seed administration access.
- ActiveStorage uses local disk by default in development; for production configure S3 or other service in `config/storage.yml`.

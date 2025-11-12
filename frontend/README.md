# Frontend — React + TypeScript + Vite

This repo contains a Vite + React + TypeScript frontend used to manage users and interact with the Rails backend API. The app includes SCSS styles, client-side validation, and ActionCable integration for realtime updates (admin counters and import progress).

Prerequisites
-------------

- Node.js 20.x (or compatible LTS)
- pnpm (repository uses pnpm lockfile)

Quick start (development)
-------------------------

1. Install dependencies:

```bash
cd frontend
pnpm install
```

2. Start the dev server (HMR + Vite):

```bash
pnpm run dev
```

3. Open the app at `http://localhost:5173` (check `vite` output for exact URL).

Configuration and environment variables
---------------------------------------

- `VITE_API_URL` — base URL for the backend API (example: `http://localhost:3001`). Make sure this matches the Rails backend host used in your environment.
- `VITE_ACTION_CABLE_URL` — optional, override ActionCable URL if different from the API URL.

Set variables in your shell or in an `.env` file used by Vite (see `.env.example` if present).

Build for production
--------------------

```bash
pnpm run build
# serve the built assets locally (optional)
pnpm run preview
```

Tests and linting
-----------------

- Unit and integration tests live under `frontend/src/test` (if present). Run:

```bash
pnpm test
```

- ESLint is configured for TypeScript; run:

```bash
pnpm run lint
```

ActionCable (realtime) integration
----------------------------------

The frontend connects to Rails' ActionCable using the `@rails/actioncable` consumer. The client sends the JWT token as a query param when establishing the websocket (see `frontend/src/services/cable.ts`) so the backend can authenticate subscriptions.

Forms and avatar uploads
------------------------

- Forms accept avatar uploads (file) or an `avatar_url`. When uploading a file, the frontend sends FormData including `avatar` file. When using `avatar_url`, the backend downloads and attaches the image server-side.
- Client-side validation prevents invalid input and gives immediate feedback before requests are sent.

Notes on styling
----------------

- SCSS is used for styling. The project follows a component-based SCSS structure co-located with components where practical.

ESLint & TypeScript
--------------------

This template supports expanding ESLint to be type-aware (see commented suggestions in the original template). For stricter type-checked rules, consider enabling `tseslint.configs.recommendedTypeChecked` and adding `tsconfig` paths in `eslint.config.js`.

Troubleshooting
---------------

- If the frontend fails to talk to the API, confirm `VITE_API_URL` points to the backend host and that CORS is configured on the backend to allow the frontend origin.
- If ActionCable subscriptions fail, check the websocket endpoint and ensure the token is included and valid.

Contributing
------------

- Follow the repository's branch strategy: create a feature branch off `development` for changes and open pull requests against `development`.
- Add tests for new features and update or create relevant specs.

If you want, I can add a small GitHub Actions workflow to run frontend lint and tests on pull requests.


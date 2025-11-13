# Frontend — React + TypeScript + Vite

## Important: create a `frontend/.env` file

Before running the frontend, create a `.env` file based on the provided example. Rename or copy `frontend/.env.example` to `frontend/.env` and update any values as needed (API URL, ActionCable URL, dev tokens, etc.). Example:

```bash
cd frontend
cp .env.example .env
```

This repo contains a Vite + React + TypeScript frontend used to manage users and interact with the Rails backend API. The app includes SCSS styles, client-side validation, and ActionCable integration for realtime updates (admin counters and import progress).

## Prerequisites

---

- Node.js 20.x (or compatible LTS)
- pnpm (repository uses pnpm lockfile)

## Quick start (development)

---

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

## Configuration and environment variables

- `VITE_API_URL` — base URL for the backend API (example: `http://localhost:3001`). Make sure this matches the Rails backend host used in your environment.
- `VITE_ACTION_CABLE_URL` — optional, override ActionCable URL if different from the API URL.

Set variables in your shell or in an `.env` file used by Vite (see `.env.example` if present).

## Build for production

---

```bash
pnpm run build
# serve the built assets locally (optional)
pnpm run preview
```

## Linting

---

- ESLint is configured for TypeScript; run:

```bash
pnpm run lint
```

## ActionCable (realtime) integration

---

The frontend connects to Rails' ActionCable using the `@rails/actioncable` consumer. The client sends the JWT token as a query param when establishing the websocket (see `frontend/src/services/cable.ts`) so the backend can authenticate subscriptions.

## Forms and avatar uploads

---

- Forms accept avatar uploads (file) or an `avatar_url`. When uploading a file, the frontend sends FormData including `avatar` file. When using `avatar_url`, the backend downloads and attaches the image server-side.
- Client-side validation prevents invalid input and gives immediate feedback before requests are sent.

## Notes on styling

---

- SCSS is used for styling. The project follows a component-based SCSS structure co-located with components where practical.

## Troubleshooting

---

- If the frontend fails to talk to the API, confirm `VITE_API_URL` points to the backend host and that CORS is configured on the backend to allow the frontend origin.
- If ActionCable subscriptions fail, check the websocket endpoint and ensure the token is included and valid.

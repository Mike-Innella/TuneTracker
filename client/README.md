# TuneTracker Client

React 19 + TypeScript + Vite frontend for TuneTracker. The app calls the backend through `/api`, uses the server-issued `tt_session` cookie for auth state, and renders UI with MUI.

## Main user flows

- Sign in / register at `/auth`
- Personal dashboard at `/dashboard`
- Project management at `/projects`
- Track board and detail workflows at:
  - `/projects/:projectId`
  - `/projects/:projectId/tracks/:trackId`
- Public discovery views:
  - `/public/:projectId`
  - `/feed`
  - `/feed/:postId`
- Profile management at `/profile`

## Stack

- React 19
- TypeScript
- Vite
- Material UI
- React Router
- Axios
- `@dnd-kit` for board drag-and-drop
- Vitest for frontend tests

## Local development

From `tunetracker/client`:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Vite runs at `http://localhost:5173` and proxies `/api` to `http://localhost:4000` via [`vite.config.ts`](./vite.config.ts).

Environment variables:

- `VITE_API_BASE_URL` (default `/api`) for API requests

To run server + client together from the client workspace:

```bash
npm run dev:full
```

## Scripts

- `npm run dev` start Vite dev server
- `npm run dev:full` start server and client together
- `npm run build` run no-JS guard + typecheck + production build
- `npm run typecheck` run TS build check
- `npm run lint` lint `src/**/*.{ts,tsx}`
- `npm run test` run Vitest once
- `npm run test:watch` run Vitest watch mode
- `npm run preview` preview production build

## Project structure

```text
client/
├── public/
├── src/
│   ├── app/                # app shell, router, theme
│   ├── features/           # auth, projects, social, profile, dashboard
│   ├── shared/             # shared lib/ui/api helpers
│   ├── __tests__/          # unit tests for client utilities
│   ├── index.css
│   └── main.tsx
└── vite.config.ts
```

## Auth and API integration

- API client config is in `src/shared/api/http.ts` with:
  - `baseURL: import.meta.env.VITE_API_BASE_URL || "/api"`
  - `withCredentials: true`
- Auth state is managed in `src/features/auth/state`
- Protected screens are wrapped by `src/app/router/ProtectedRoute.tsx`
- Unauthenticated users are redirected to `/auth` for protected routes

## Notes for contributors

- `src/` is TypeScript-only; `.js/.jsx` under `src` fails build/lint guards
- Audio uploads are validated client-side before request submission
- Visual tokens and shared patterns live under `src/app/theme`

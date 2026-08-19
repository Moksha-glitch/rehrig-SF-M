# Vision Pulse

React + Vite + Tailwind workspace for Rehrig Pacific service operations. The app has two backends behind one UI:

| Mode | Data | When to use |
| --- | --- | --- |
| **demo** (default) | Local seed + `localStorage` | Day-to-day UI work. No API process. |
| **api** | JWT + `vision-api` | Integration against a live backend. |

Vite resolves `@backend` to `src/backends/demo` or `src/backends/api` from `VITE_APP_MODE`.

## Requirements

- Node.js 18.18+ (20 LTS recommended)
- npm 9+

## Run

```bash
cd vision-app
npm install
npm run dev          # demo on http://localhost:5173
npm run dev:api      # API mode on http://localhost:5174
```

| Script | What it does |
| --- | --- |
| `npm run dev` / `dev:demo` | Vite, demo mode, port 5173 |
| `npm run dev:api` | Vite, API mode, port 5174 (proxies `/api` → `localhost:4000`) |
| `npm run build` / `build:demo` | Production bundle, demo backend |
| `npm run build:api` | Production bundle, API backend |
| `npm run check` | Builds both modes |
| `npm run preview` | Serves the last build |

Copy `.env.example` only if you need a local override. Committed mode files:

- `.env.demo` — `VITE_APP_MODE=demo`
- `.env.api` — `VITE_APP_MODE=api` and `VITE_API_URL=http://localhost:4000/api/v1`

## Demo sign-in

Password for every seed user: `vision`

| Persona | Email | Role |
| --- | --- | --- |
| Rehrig | `helena@vision.io` | Admin |
| Provider | `yolanda@vision.io` | SP Admin |
| Provider | `marcus@vision.io` | Ops Manager |
| Provider | `jordan@vision.io` | Maintenance Admin |
| Customer | `sam@vision.io` | Portal User |

The login screen also has a demo-user picker. Theme is Light / Dark / System (`vision.theme` + `data-theme`).

## Layout

```
src/
  App.jsx                 Router + shell
  backends/demo|api       Auth, store, hooks, contract extract
  components/             Sidebar, Vision AI, mobile chrome
  data/                   Seed, RBAC, schemas, assistant intents
  hooks/                  Re-exports from @backend
  screens/                Module pages
  services/               HTTP clients (API mode only)
  state/                  Store + auth context
  utils/                  Persistence, navigation, theme
```

Product rules that matter while developing:

- Home is not Vision AI. Chat retracts when the module changes.
- No Salesforce App Launcher / Help / Trailhead / Setup Menu chrome.
- Rehrig users cannot mutate operational records.
- Your Account is the signed-in user, not a service-provider account.

Reset demo data by clearing `localStorage` keys that start with `vision.`.

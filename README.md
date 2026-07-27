# Rehrig Vision (SF Migration)

Operations SPA for service providers, field crews, and resident programs — with a **demo** (local seed) instance and an **API** (JWT + Express) instance.

## Packages

| Path | Purpose |
|------|---------|
| `vision-app` | React + Vite frontend |
| `vision-api` | Express REST API (local integration prototype) |

Demo and API data layers are split under `vision-app/src/backends/{demo,api}` via the Vite `@backend` alias.

## Quick start

```bash
# Root helpers (optional)
npm install

# Demo — local seed, no API (http://localhost:5173)
npm run dev:demo

# API mode — API :4000 + web :5174
cp vision-api/.env.example vision-api/.env
npm install --prefix vision-api
npm install --prefix vision-app
npm run dev:api
```

Demo login password: `vision` (see Login → Testing only).

## Modes

- `vision-app/.env.demo` → `VITE_APP_MODE=demo`
- `vision-app/.env.api` → `VITE_APP_MODE=api` + `VITE_API_URL`

The API instance is for integration demos, not production.

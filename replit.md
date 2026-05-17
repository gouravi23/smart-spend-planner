# SmartSpend

A full-stack desktop expense tracker and budget planner with JWT auth, MongoDB, and Recharts analytics.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/smartspend run dev` — run the frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- Required env: `MONGODB_URI` — MongoDB Atlas connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite, Tailwind CSS v4, shadcn/ui, wouter, TanStack Query, react-hook-form, recharts
- API: Express 5 + pino logging
- DB: MongoDB Atlas + Mongoose (no PostgreSQL/Drizzle)
- Auth: JWT (jsonwebtoken) + bcryptjs, token stored in localStorage
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/` — Express API server
  - `src/models/` — Mongoose models (User, Expense, Budget)
  - `src/routes/` — Express route handlers (auth, expenses, budget, analytics)
  - `src/lib/` — MongoDB connection, JWT helpers, logger
  - `src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/smartspend/` — React+Vite frontend
  - `src/pages/` — Login, Register, Dashboard, Expenses, Budget, Analytics
  - `src/components/Layout.tsx` — Fixed 240px sidebar + main content layout
  - `src/lib/auth.tsx` — AuthContext and AuthProvider
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/` — Generated React Query hooks (from Orval)
- `lib/api-zod/` — Generated Zod schemas (from Orval)

## Architecture decisions

- MongoDB + Mongoose instead of PostgreSQL/Drizzle — chosen for this project
- JWT stored in localStorage (not cookies) — simple, no CSRF issues for desktop-only app
- Mongoose pre-save hook uses `async function ()` without `next` param (Mongoose 9 style)
- `setAuthTokenGetter` from `@workspace/api-client-react` wires the JWT into all generated API hooks
- Desktop-only layout: no responsive breakpoints needed, fixed 240px sidebar

## Product

- User auth: register/login with JWT, bcrypt password hashing
- Expenses: add/edit/delete with title, amount, category, date, description; paginated list with filters by category and date range
- Budget: set total monthly limit + per-category limits; visual progress bars
- Dashboard: stat cards (spent/budget/remaining/count), pie chart by category, bar chart of monthly trend, recent expenses list
- Analytics: donut chart by category, bar chart + line chart for 6-month trend

## User preferences

- No emojis in UI
- Desktop-only (no mobile layout)
- Indian Rupee (₹) currency formatting
- Categories: Food, Travel, Bills, Shopping, Education, Health, Entertainment, Other
- Color scheme: deep indigo primary (`238 83% 60%`), dark navy sidebar (`222 47% 11%`)

## Gotchas

- Mongoose pre-save async hooks must NOT use `next` param in Mongoose 9 — just return early instead
- MongoDB URI secret key is `MONGODB_URI` (not the URI string itself as a key)
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes
- API server must be restarted after code changes (it builds first then starts)
- Do NOT use chart.js — recharts is already installed

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

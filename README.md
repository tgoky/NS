# stuffsdrop

Give away what you don't need, find what you love. Free drops, swaps, wishes, and tracked delivery, built on Next.js 16, Drizzle ORM and Supabase (auth + storage).

This repo replaces the old Refine + Prisma `stuffsdrop` app. It uses the **same Postgres database**: `src/db/schema.ts` mirrors the tables Prisma created, so there's no data migration.

## Setup

```bash
pnpm install
cp .env.example .env     # fill in Supabase + database values
pnpm dev
```

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth sessions (browser + server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Creating users at sign-up, image uploads to the `items` bucket |
| `DATABASE_URL` | Runtime queries through the Supabase pooler (port 6543) |
| `DIRECT_URL` | `drizzle-kit` schema pushes and migrations (port 5432) |
| `OPENROUTER_API_KEY` (optional) | AI authenticity check on luxury-brand uploads |

## Database

```bash
pnpm db:push       # sync src/db/schema.ts to the database
pnpm db:generate   # write SQL migrations to drizzle/
pnpm db:migrate    # apply them
pnpm db:studio     # browse data
```

Against the existing Prisma-managed database, `pnpm db:push` reports no changes.

## Layout

- `src/app/(app)/`: signed-in pages. The layout checks the session and wraps them in the shell.
- `src/components/shell/`: the app shell, a top bar over **primary rail | secondary sidebar | page | notifications panel**. The sidebar's links come from whichever rail section the route belongs to (`src/lib/nav.ts`). Below `md` a floating pill opens the same navigation full-screen.
- `src/app/api/`: route handlers (Drizzle). `withAuth` in `src/lib/api.ts` resolves the Supabase user to their `User` row.
- `src/db/`: Drizzle schema and client.
- `src/proxy.ts`: refreshes the Supabase session cookie on each request (Next 16's replacement for `middleware.ts`).

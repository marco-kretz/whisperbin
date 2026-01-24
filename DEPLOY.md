# Coolify Deployment

## Build & Run

- Build command: `pnpm build`
- Start command: `pnpm start` (alias for `node build`)
- Node version: 18+ (prefer 20 LTS)

## Environment

- `DATABASE_URL` must point to a persistent SQLite file path (example: `/data/local.db`).

## Persistence

- Mount a persistent volume to `/data` (or another path you use in `DATABASE_URL`).
- Keep the app to **one replica**; SQLite is not safe with multiple instances.

## Database Init

Run once after first deploy (or after schema changes):

```bash
pnpm db:push
```

## Proxy Notes

- Ensure your reverse proxy allows request bodies > 120 KB (encrypted paste payload limit).

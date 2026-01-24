# Coolify Deployment

## Build & Run

- Build command: `bun run build`
- Start command: `bun start`
- Runtime: Bun 1.0+

## Environment

- `DATABASE_URL` must point to a persistent SQLite file path (example: `/data/local.db`).
- `RATE_LIMIT_REDIS_URL` should point to a Redis instance (required in production).
- `TRUSTED_PROXY_IPS` should list your reverse proxy IPs (example: `127.0.0.1,::1`).
- `BODY_SIZE_LIMIT` should match your proxy request size limit (example: `256K`).

## Persistence

- Mount a persistent volume to `/data` (or another path you use in `DATABASE_URL`).
- Keep the app to **one replica**; SQLite is not safe with multiple instances.

## Database Init

Run once after first deploy (or after schema changes):

```bash
bun db:push
```

## Proxy Notes

- Ensure your reverse proxy allows request bodies >= `BODY_SIZE_LIMIT`.
- The default encrypted payload limit is 120 KB, so `BODY_SIZE_LIMIT=256K` is recommended.

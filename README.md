# whiserpbin

Encrypted, disposable paste sharing built with SvelteKit, Tailwind CSS v4, Drizzle, and SQLite.

## Features

- Client-side AES-GCM encryption (server never sees the key)
- Optional password protection and one-time reveal
- Expiration-based cleanup
- Syntax highlighting via highlight.js
- JavaScript required for create/decrypt flows

## How It Works

1. The browser encrypts your title/content with AES-GCM.
2. The ciphertext is stored on the server.
3. The decryption key lives only in the URL fragment (`#key=...`).

Anyone with the full URL can decrypt the paste, so share carefully.

## Requirements

- Node.js 22+
- pnpm

## Local Development

```bash
pnpm install
pnpm dev
```

## Scripts

```bash
pnpm run build
pnpm start
pnpm lint
pnpm check
```

## Configuration

Environment variables:

- `DATABASE_URL` - SQLite file path (example: `/data/local.db`)
- `RATE_LIMIT_REDIS_URL` - Redis connection string for rate limiting (required in production)
- `TRUSTED_PROXY_IPS` - Comma-separated proxy IPs allowed to set `X-Forwarded-For`
- `PORT` - Server port (defaults to 3000)
- `HOST` - Server host (defaults to 0.0.0.0)

## Limits (Defaults)

- Title length: 120 characters
- Content length (plaintext): 20,000 characters
- Encrypted payload (ciphertext): 120,000 characters
- Password length: 200 characters

## Deployment

See `DEPLOY.md` for Coolify guidance.

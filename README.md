# whisperbin

Encrypted, disposable paste sharing built with SvelteKit, Tailwind CSS v4, Drizzle, and SQLite.

## Features

- Client-side AES-GCM encryption (server never sees the key)
- Optional password protection and one-time reveal (burn after reading)
- Expiration after 1 hour, 6 hours, 24 hours, or 7 days
- Syntax highlighting via highlight.js (Plaintext, Markdown, JavaScript, TypeScript, PHP, JSON,
  HTML, CSS, Bash)
- Built-in password generator (length and symbols are remembered in `localStorage`)
- German UI
- JavaScript required for create/decrypt flows

## How It Works

1. The browser encrypts your title/content with AES-GCM.
2. The ciphertext is stored on the server.
3. The decryption key lives only in the URL fragment (`#key=...`).

Anyone with the full URL can decrypt the paste, so share carefully.

The optional password is checked server-side (scrypt hash) before the ciphertext is handed out; it
is not part of the encryption key. One-time pastes are wiped from the database on first reveal.
Expired pastes are deleted when accessed or when a new paste is created.

## Requirements

- Node.js 22+
- pnpm

## Local Development

```bash
pnpm install
pnpm db:push
pnpm dev
```

Local defaults live in the committed `.env.development` (SQLite `local.db`, in-memory rate limits
without Redis). Put personal overrides in `.env.development.local`.

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
- `RATE_LIMIT_REDIS_URL` - Redis connection string for rate limiting (required in production;
  `REDIS_URL` is used as a fallback)
- `ADDRESS_HEADER` - Header carrying the real client IP behind a proxy (e.g. `CF-Connecting-IP`,
  see adapter-node docs)
- `PORT` - Server port (defaults to 3000)
- `HOST` - Server host (defaults to 0.0.0.0)

## Limits (Defaults)

- Title length: 120 characters
- Content length (plaintext): 20,000 characters
- Encrypted payload (ciphertext): 120,000 characters
- Password length: 200 characters
- Rate limits per IP: 30 requests/minute overall, 10 new pastes/minute, 10 password attempts per
  5 minutes

## Deployment

See `DEPLOY.md` for Coolify guidance.

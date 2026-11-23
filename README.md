# whisperbin

Encrypted, disposable paste sharing built with SvelteKit, Tailwind CSS v4, Drizzle, and SQLite.

## Features

- Client-side AES-GCM encryption (server never sees the key)
- Optional password protection and one-time reveal (burn after reading)
- Expiration after 1 hour, 6 hours, 24 hours, or 7 days
- Syntax highlighting via highlight.js (Plaintext, Markdown, JavaScript, TypeScript, PHP, JSON,
  HTML, CSS, Bash)
- Built-in password generator (length and symbols are remembered in `localStorage`)
- English and German UI, picked from the browser language and switchable in the header
- JavaScript required for create/decrypt flows

## How It Works

1. The browser encrypts your title/content with AES-GCM.
2. The ciphertext is stored on the server.
3. The decryption key lives only in the URL fragment (`#key=...`).

Anyone with the full URL can decrypt the paste, so share carefully.

### Trust Model

Encryption runs in the browser, but the browser runs the JavaScript the server delivers. A malicious
or compromised server could ship code that leaks the key; this applies to any web-based end-to-end
encryption. The source code is public, so it can be audited and self-hosted, but that alone doesn't
prove what a given instance actually serves. If you don't trust an instance's operator, run your own.

The optional password is part of the encryption: the browser derives the AES key from the link key
and the password (PBKDF2-SHA256, 600,000 iterations), so the link alone can't decrypt a
password-protected paste, even with access to the database. The server also checks the password
(scrypt hash) before handing out the ciphertext, so it does receive the password. One-time pastes are wiped from the database on first reveal.
Expired pastes are deleted when accessed, when a new paste is created, and by a cleanup job every
15 minutes.

## Requirements

- Node.js 26+
- pnpm 12

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
- Password attempts per paste: after 5 failures within 5 minutes, each attempt is delayed
  (250 ms, doubling up to 5 s) before verification

## Deployment

See `DEPLOY.md` for Coolify guidance.

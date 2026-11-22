# AGENTS.md — whisperbin

**whisperbin** is an encrypted, disposable paste-sharing web app (zero-knowledge pastebin) built
with SvelteKit 3, Svelte 5, TypeScript, Tailwind CSS v4, Drizzle ORM (SQLite via `better-sqlite3`),
and Redis (production rate limiting).

## Core Security & Domain Invariants

Never weaken or bypass these guarantees:

- **Client-side E2E encryption (`src/lib/crypto.ts`)**: Title and content are encrypted in the
  browser with AES-GCM 256. The decryption key lives exclusively in the URL fragment (`#key=...`)
  and must never be sent to, stored by, or logged on the server. Paste creation rejects unencrypted
  submissions.
- **Password protection**: Optional passwords are hashed server-side with `scrypt` and compared via
  `timingSafeEqual` (`src/lib/server/paste.ts`). They gate ciphertext retrieval and are independent
  of the client-side encryption key.
- **Burn-after-reading (one-time pastes)**: Consumed atomically in a single conditional `UPDATE`
  that sets `consumedAt` and wipes `title`, `content`, `contentIv`, `passwordHash`, and
  `passwordSalt`. SQLite runs with `PRAGMA secure_delete = ON` so wiped rows are overwritten on
  disk.
- **Expiration**: Expired pastes are purged lazily on access (`getPasteOrDeleteIfExpired`), on new
  paste creation (`deleteExpiredPastes`), and periodically every 15 minutes via `ServerInit`
  (`src/hooks.server.ts`).
- **Headers & CSP**: Strict CSP is configured in `vite.config.ts` (`script-src: ['self']`, no
  inline scripts). `src/hooks.server.ts` adds security headers and `Cache-Control: no-store` on
  HTML and JSON responses (JSON covers `__data.json` and form actions, which carry ciphertext).
- **Rate limiting (`src/lib/server/rate-limit.ts`)**: Uses Redis in production
  (`RATE_LIMIT_REDIS_URL`, fallback `REDIS_URL`), falls back to in-memory maps in non-production,
  and is bypassed when `dev` (`vite dev`) is true. Rate limits are scoped (`global` vs `create`),
  and password unlocks enforce both a per-IP attempt limit and a per-paste failed-attempt limit.

## Framework & Codebase Conventions

This project uses **SvelteKit 3** (`@sveltejs/kit` v3) and **Svelte 5**—avoid SvelteKit 2 / Svelte 4
patterns:

- **SvelteKit config**: Defined inside `sveltekit({ ... })` in `vite.config.ts` (there is no
  `svelte.config.js`).
- **Environment variables**: Declared in `src/env.ts` via `defineEnvVars` and imported from
  `$app/env/private` (`dev` comes from `$app/env`). Do **not** use `$env/dynamic/private`,
  `$env/static/private`, or `$app/environment`.
- **Internal imports**: Use `package.json` subpath imports `#lib` / `#lib/*` with `.js` extensions
  (e.g., `#lib/server/paste.js`), **not** `$lib`.
- **Error handling**: In SvelteKit 3, `handleError` in `src/hooks.server.ts` also receives expected
  errors (`error(404, ...)`). Keep `if (kind !== 'unknown') return;` so expected status messages are
  preserved.
- **Svelte 5**: Use runes (`$props`, `$state`, `$derived`, `$effect`) and `$app/state` (not
  `$app/stores`). Never write to module-level `$state` during SSR (it leaks across requests; see
  `src/lib/i18n.svelte.ts`).
- **i18n (EN/DE)**: Translations live in `src/lib/i18n.ts`; reactive state in
  `src/lib/i18n.svelte.ts`. Server actions return `ErrorKey` strings rather than hardcoded messages.
  Locale switching happens in-place without reloading so revealed one-time pastes and share keys are
  not lost.
- **Database**: Drizzle schema is in `src/lib/server/db/schema.ts`. `src/lib/server/db/index.ts`
  lazily initializes SQLite behind a `Proxy` so builds don't require a live DB. Local dev defaults
  live in `.env.development`.

## Commands

Use **pnpm** (`pnpm@10`):

- `pnpm dev` / `pnpm build` / `pnpm start` — Dev server, production build, run built Node server
- `pnpm check` — `svelte-kit sync && svelte-check` (TypeScript strict mode)
- `pnpm lint` — Prettier check + ESLint
- `pnpm format` — Auto-format with Prettier (tabs, single quotes, no trailing commas, Tailwind sort)
- `pnpm db:push` / `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:studio` — Drizzle SQLite tasks

No automated test framework is configured yet.

**Always run `pnpm lint` and `pnpm check` after making changes.**

## Project Map

```text
vite.config.ts              # Vite + SvelteKit 3 config, adapter-node, CSP
drizzle.config.ts           # Drizzle Kit config (loads .env.development* outside prod)
src/
├── env.ts                  # SvelteKit 3 defineEnvVars schema
├── hooks.server.ts         # Global rate limit, locale detection, security headers, handleError
├── lib/
│   ├── crypto.ts           # Browser AES-GCM encrypt/decrypt + unbiased password generator
│   ├── i18n.ts             # EN/DE message dictionary, locale detection, ErrorKey types
│   ├── i18n.svelte.ts      # Client-side reactive locale state & in-place switcher
│   ├── paste-options.ts    # Allowed expiration durations & highlight.js languages
│   └── server/
│       ├── db/             # schema.ts (paste table) + index.ts (lazy SQLite client)
│       ├── paste.ts        # Paste CRUD, scrypt password hashing, atomic one-time consume
│       ├── rate-limit.ts   # Redis + in-memory rate limiting & password brute-force delay
│       └── redis.ts        # Lazy Redis client
└── routes/
    ├── +layout.server.ts   # Passes detected locale to client
    ├── +layout.svelte      # Header, locale switcher, footer
    ├── +page.server.ts     # Paste creation action & validation
    ├── +page.svelte        # Paste creation UI + client-side encryption + share link
    ├── [id]/               # Paste reveal, password unlock, one-time consume, decryption
    ├── impressum/          # Legal notice page
    └── privacy/            # Privacy policy page
```

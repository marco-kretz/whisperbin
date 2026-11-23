# Coolify Deployment

## Deployment Options

### Option 1: Dockerfile (Recommended)

1. Create a new resource in Coolify
2. Select your Git repository
3. Choose **"Dockerfile"** as the build pack
4. Set the port to **3000** (or use the `PORT` environment variable)
5. Configure environment variables (see below)
6. Add a persistent volume mounted to `/data`

### Option 2: Docker Compose

1. Create a new resource in Coolify
2. Select **"Docker Compose"** as the build pack
3. Specify `docker-compose.yml` as the compose file
4. Configure environment variables in the compose file or Coolify UI

## Build & Run

- **Build command**: `pnpm run build` (handled automatically by Dockerfile)
- **Start command**: `node build` (handled automatically by Dockerfile CMD)
- **Runtime**: Node.js 26+ with pnpm
- **Port**: 3000 (adapter-node uses `PORT` env var, defaults to 3000)

## Required Environment Variables

Set these in Coolify's Environment Variables section:

- `DATABASE_URL` - SQLite file path (example: `/data/local.db`)
- `RATE_LIMIT_REDIS_URL` - Redis connection string (required in production)
  - For Docker Compose: set automatically from `REDIS_PASSWORD`
    (`redis://default:${REDIS_PASSWORD}@redis:6379`)
  - For standalone: Use Coolify's Redis service or external Redis URL
- `REDIS_PASSWORD` - Required when deploying with `docker-compose.yml` (Redis auth password)
  - Must be URL-safe (no `@ : / # ? %`), since it is embedded in the Redis URL;
    generate one with `openssl rand -hex 32`
  - **Upgrade note**: Compose no longer falls back to a default password and refuses to start
    until `REDIS_PASSWORD` is set
- `ADDRESS_HEADER` - Header carrying the real client IP, used for rate limiting
  - Behind Cloudflare: `CF-Connecting-IP` (only safe if the origin accepts traffic from Cloudflare only)
  - Behind a plain reverse proxy: `X-Forwarded-For`, plus `XFF_DEPTH` = number of trusted proxies
- `PORT` - Server port (defaults to 3000, adapter-node uses this env var)
- `HOST` - Server host (defaults to 0.0.0.0)
- `NODE_ENV` - Set to `production` (optional, defaults in Dockerfile)

## Persistence

- **Mount a persistent volume** to `/data` in Coolify
- This directory stores the SQLite database file
- **Important**: Keep the app to **one replica**; SQLite is not safe with multiple instances

## Redis Setup

### Option 1: Use Coolify's Redis Service

1. Create a Redis resource in Coolify
2. Use the connection string provided by Coolify for `RATE_LIMIT_REDIS_URL`

### Option 2: Use Docker Compose Redis

- If using Docker Compose deployment, Redis is included in `docker-compose.yml`
- Set `REDIS_PASSWORD` to a strong, URL-safe secret (`RATE_LIMIT_REDIS_URL` is configured
  automatically)

## Database Initialization

After first deployment, initialize the database schema as the `node` user so `/data/local.db` is
writable by the running app:

1. Open a shell/terminal in the running container via Coolify (or `docker exec -it -u node <container> sh`)
2. Run: `su-exec node node_modules/.bin/drizzle-kit push` (or `node_modules/.bin/drizzle-kit push`
   if already running as `node`)

Or use Coolify's "Execute Command" feature:

- Command: `su-exec node node_modules/.bin/drizzle-kit push --force`
- Without a TTY, `drizzle-kit` cannot show its confirmation prompt, so `--force` is required there.
  It applies data-loss statements without asking; for schema changes prefer the interactive shell
- The runtime image has no `pnpm`, so call `drizzle-kit` directly instead of `pnpm db:push`
- Run this once after first deploy or after schema changes (if you ran it as `root`,
  restart the container once so the entrypoint fixes `/data` permissions)

## Proxy Notes

- Ensure your reverse proxy (Coolify's Traefik) allows request bodies >= 256KB
- The default encrypted payload limit is 120 KB; `BODY_SIZE_LIMIT=262144` is set in the `Dockerfile`
  so `adapter-node` enforces a 256 KB stream limit as well
- Coolify automatically handles SSL/TLS termination and proxying

## Troubleshooting

- **Database errors / permissions**: Ensure `/data` volume is mounted and writable. The container
  runs the Node app as `node` (UID 1000) and automatically runs `chown -R node:node /data` via its
  entrypoint so existing volumes migrate cleanly.
- **Redis connection errors**: Verify `RATE_LIMIT_REDIS_URL` is correct and Redis is accessible
- **Port conflicts**: Ensure port 3000 is available or set `PORT` environment variable

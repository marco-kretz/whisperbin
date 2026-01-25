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
- **Runtime**: Node.js 22+ with pnpm
- **Port**: 3000 (adapter-node uses `PORT` env var, defaults to 3000)

## Required Environment Variables

Set these in Coolify's Environment Variables section:

- `DATABASE_URL` - SQLite file path (example: `/data/local.db`)
- `RATE_LIMIT_REDIS_URL` - Redis connection string (required in production)
  - For Docker Compose: `redis://redis:6379`
  - For standalone: Use Coolify's Redis service or external Redis URL
- `TRUSTED_PROXY_IPS` - Comma-separated proxy IPs (example: `127.0.0.1,::1`)
  - For Coolify: Typically `127.0.0.1,::1` or Coolify's internal network IPs
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
- Set `RATE_LIMIT_REDIS_URL=redis://redis:6379`

## Database Initialization

After first deployment, initialize the database schema:

1. Open a shell/terminal in the running container via Coolify
2. Run: `pnpm db:push`

Or use Coolify's "Execute Command" feature:

- Command: `pnpm db:push`
- Run this once after first deploy or after schema changes

## Proxy Notes

- Ensure your reverse proxy (Coolify's Traefik) allows request bodies >= 256KB
- The default encrypted payload limit is 120 KB, so configure your proxy accordingly
- Coolify automatically handles SSL/TLS termination and proxying
- Body size limits are handled at the reverse proxy level with Node.js adapter

## Troubleshooting

- **Database errors**: Ensure `/data` volume is mounted and writable
- **Redis connection errors**: Verify `RATE_LIMIT_REDIS_URL` is correct and Redis is accessible
- **Port conflicts**: Ensure port 3000 is available or set `PORT` environment variable

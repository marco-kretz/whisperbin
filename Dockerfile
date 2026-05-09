FROM node:22-alpine AS build

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

# Create data directory before build to avoid database initialization errors
# Set a dummy DATABASE_URL for build if not provided
ENV DATABASE_URL=${DATABASE_URL:-:memory:}
RUN mkdir -p /data || true

RUN pnpm run build
RUN pnpm prune --prod

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/drizzle.config.ts /app/drizzle.config.ts
COPY --from=build /app/src/lib/server/db/schema.ts /app/src/lib/server/db/schema.ts

# Create data directory for SQLite database
RUN mkdir -p /data

EXPOSE 3000

CMD ["node", "build"]

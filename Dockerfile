FROM node:26-alpine AS build

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.33.0

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package.json pnpm-lock.yaml* ./
COPY scripts/prepare.mjs ./scripts/prepare.mjs
RUN pnpm install --frozen-lockfile

COPY . .

# Create data directory before build to avoid database initialization errors
# Set a dummy DATABASE_URL for build if not provided
ARG DATABASE_URL=:memory:
ENV DATABASE_URL=$DATABASE_URL
RUN mkdir -p /data || true

RUN pnpm run build
RUN pnpm prune --prod

FROM node:26-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV BODY_SIZE_LIMIT=262144

RUN apk add --no-cache su-exec

COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/drizzle.config.ts /app/drizzle.config.ts
COPY --from=build /app/src/lib/server/db/schema.ts /app/src/lib/server/db/schema.ts
COPY scripts/whisperbin-entrypoint.sh /usr/local/bin/whisperbin-entrypoint.sh

# Create data directory for SQLite database and make entrypoint executable
RUN mkdir -p /data && chown -R node:node /data && chmod +x /usr/local/bin/whisperbin-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["whisperbin-entrypoint.sh"]
CMD ["node", "build"]

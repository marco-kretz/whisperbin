FROM node:22-alpine AS build

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:22-alpine AS runtime

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

ENV NODE_ENV=production

# Install production dependencies only
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# Copy build output and necessary files
COPY --from=build /app/build /app/build
COPY --from=build /app/drizzle.config.ts /app/drizzle.config.ts
COPY --from=build /app/src/lib/server/db/schema.ts /app/src/lib/server/db/schema.ts

# Create data directory for SQLite database
RUN mkdir -p /data

EXPOSE 3000

CMD ["node", "build"]

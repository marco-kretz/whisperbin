# Agent Instructions for mk-pasteit

This document contains instructions for agentic coding assistants working in this repository.

## Project Overview

SvelteKit application with TypeScript, Tailwind CSS v4, and Drizzle ORM with SQLite.

## Package Manager

Use **pnpm** for all package operations:

- `pnpm install` - Install dependencies
- `pnpm add <package>` - Add new package
- `pnpm add -D <package>` - Add dev dependency

## Development Commands

### Build & Run

- `pnpm dev` - Start development server
- `pnpm dev -- --open` - Start dev server and open in browser
- `pnpm build` - Create production build
- `pnpm preview` - Preview production build

### Type Checking & Linting

- `pnpm check` - Run svelte-check type checker
- `pnpm check:watch` - Watch mode for type checking
- `pnpm lint` - Run prettier check and eslint
- `pnpm format` - Format code with prettier

**ALWAYS run `pnpm lint` and `pnpm check` after making changes.**

### Database

- `pnpm db:push` - Push schema changes to database
- `pnpm db:generate` - Generate migrations
- `pnpm db:migrate` - Run migrations
- `pnpm db:studio` - Open Drizzle Studio

### Testing

No test framework is currently configured. Tests should be added using Vitest or similar framework before implementing test-driven development.

## Code Style Guidelines

### Formatting (Prettier)

- Use **tabs** for indentation
- Use **single quotes** for strings
- **No trailing commas**
- Max line width: 100 characters
- Tailwind CSS classes are auto-sorted via plugin

### TypeScript Configuration

- **Strict mode enabled** - All type errors must be resolved
- `rewriteRelativeImportExtensions: true` - Rewrites relative imports with extensions
- `esModuleInterop: true` - ES module interoperability
- `forceConsistentCasingInFileNames: true` - Enforce consistent casing

### Import Organization

Import order: External dependencies → Svelte/Dynamic imports → Local modules

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';
import * as schema from './schema';
```

### Naming Conventions

- **Files**: kebab-case (e.g., `user-service.ts`, `+page.svelte`)
- **Components/Functions**: camelCase (e.g., `getUserById`, `UserProfile`)
- **Types/Interfaces**: PascalCase (e.g., `User`, `ApiResponse`)
- **Constants**: UPPER_SNAKE_CASE for global constants (e.g., `MAX_RETRIES`)
- **Tables (Drizzle)**: lowercase (e.g., `user`, `post`)

### Svelte 5 Patterns

- Use **runes** ($props, $state, $derived) instead of the export let syntax
- Component props: `let { children } = $props();`
- Server-side imports: `$env/dynamic/private` or `$env/static/private`

### Error Handling

- Use descriptive error messages with `throw new Error()`
- Check environment variables early:

```typescript
if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
```

- Always handle database operations with try/catch in production code

### Database Operations (Drizzle ORM)

- Schema files in: `src/lib/server/db/schema.ts`
- Database client in: `src/lib/server/db/index.ts`
- Use `crypto.randomUUID()` for UUID primary keys
- Export table names as lowercase constants
- Use strongly-typed queries with the schema

### Directory Structure

```
src/
├── lib/
│   ├── assets/        # Static assets
│   ├── server/        # Server-side code
│   └── index.ts       # Barrel exports
├── routes/            # SvelteKit routes
│   ├── +layout.svelte
│   └── +page.svelte
└── app.d.ts          # Type declarations
```

### Code Quality Rules

- **ESLint** enforces: no-undef is disabled (TypeScript handles this)
- Run `pnpm lint` to check for issues
- Run `pnpm format` to fix formatting issues
- Always resolve TypeScript strict mode errors before committing
- Use existing libraries before adding new dependencies

### When Adding Features

1. Check existing patterns in the codebase first
2. Follow import organization rules
3. Use TypeScript types explicitly
4. Write descriptive error messages
5. Update schema files if database changes are needed
6. Run `pnpm lint` and `pnpm check` after changes
7. Format with `pnpm format` if needed

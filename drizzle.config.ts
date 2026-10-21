import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit doesn't read Vite's env files; already-set variables take precedence
if (process.env.NODE_ENV !== 'production' && existsSync('.env.development')) {
	process.loadEnvFile('.env.development');
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	dbCredentials: { url: process.env.DATABASE_URL },
	verbose: true,
	strict: true
});

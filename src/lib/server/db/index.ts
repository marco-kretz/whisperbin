import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
if (typeof Bun === 'undefined') throw new Error('Bun runtime is required for SQLite');

const { drizzle } = await import('drizzle-orm/bun-sqlite');
const { Database } = await import('bun:sqlite');

const databaseUrl = env.DATABASE_URL.replace(/^sqlite:\/\//, '');
const client = new Database(databaseUrl);

export const db = drizzle(client, { schema });

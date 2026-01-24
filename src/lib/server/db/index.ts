import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const databaseUrl = env.DATABASE_URL.replace(/^sqlite:\/\//, '');
const client = new Database(databaseUrl);

export const db = drizzle(client, { schema });

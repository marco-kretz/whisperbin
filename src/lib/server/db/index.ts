import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: Database | null = null;

function getDb() {
	if (_db) return _db;

	if (!env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set');
	}

	const databaseUrl = env.DATABASE_URL.replace(/^sqlite:\/\//, '');
	
	// Use in-memory database if DATABASE_URL is set to :memory:
	if (databaseUrl === ':memory:') {
		_client = new Database(':memory:');
		_db = drizzle(_client, { schema });
		return _db;
	}
	
	// Ensure the directory exists before opening the database
	const dbDir = dirname(databaseUrl);
	if (dbDir !== '.' && dbDir !== '') {
		if (!existsSync(dbDir)) {
			mkdirSync(dbDir, { recursive: true });
		}
	}

	_client = new Database(databaseUrl);
	_db = drizzle(_client, { schema });

	return _db;
}

// Lazy initialization - only create connection when actually accessed
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
	get(_target, prop) {
		return getDb()[prop as keyof ReturnType<typeof drizzle>];
	}
});

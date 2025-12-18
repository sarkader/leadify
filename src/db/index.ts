import * as schema from './schema';

let dbImpl: any;

if (process.env.DATABASE_URL) {
  // Postgres (production)
  const { drizzle } = require('drizzle-orm/node-postgres');
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  dbImpl = drizzle(pool, { schema });
} else {
  // SQLite (local dev)
  const Database = require('better-sqlite3');
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  const sqlite = new Database(process.env.SQLITE_PATH || 'sqlite.db');
  dbImpl = drizzle(sqlite, { schema });
}

export const db = dbImpl as any;
export type Schema = typeof schema;

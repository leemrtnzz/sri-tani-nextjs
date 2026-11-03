import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const connectionUri =
  process.env.DATABASE_URL_UTAMA ||
  process.env.DATABASE_URL ||
  'mysql://root@127.0.0.1:3306/db_sri_tani';

const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined;
};

export const pool =
  globalForDb.pool ??
  mysql.createPool({
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema, mode: 'default' });
export * from './schema';


import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UTAMA || process.env.DATABASE_URL || 'mysql://root@127.0.0.1:3306/db_sri_tani',
  },
});

export * from './db/schema';

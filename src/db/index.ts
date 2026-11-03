import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const isLocal = /localhost|127\.0\.0\.1/.test(databaseUrl);

const globalForDb = globalThis as typeof globalThis & {
  __dbiPool?: Pool;
};

export const pool =
  globalForDb.__dbiPool ??
  new Pool({
    connectionString: databaseUrl,
    // Supabase (and most hosted Postgres) require SSL. Local dev does not.
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__dbiPool = pool;
}

export const db = drizzle(pool, { schema });

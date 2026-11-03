import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const isLocal = /localhost|127\.0\.0\.1/.test(databaseUrl);
const g = globalThis as typeof globalThis & { __dbiAdminPool?: Pool };
export const pool = g.__dbiAdminPool ?? new Pool({ connectionString: databaseUrl, ssl: isLocal ? undefined : { rejectUnauthorized: false }, max: 5 });
if (process.env.NODE_ENV !== "production") g.__dbiAdminPool = pool;
export const db = drizzle(pool, { schema });

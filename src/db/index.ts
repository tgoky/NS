import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Runtime queries go through the pooled connection (DATABASE_URL, Supabase
// pooler on port 6543). drizzle.config.ts uses DIRECT_URL for schema pushes.

type Database = PostgresJsDatabase<typeof schema>;

declare global {
  var __stuffsdrop_db: Database | undefined;
}

function createDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add the Supabase pooler connection string to .env.");
  }
  // `prepare: false` is required for Supabase's transaction-mode pooler.
  const client = postgres(url, { prepare: false, max: 5 });
  return drizzle(client, { schema });
}

// Created on first use rather than at import, so `next build` can load the
// route modules without a database URL in the build environment.
export function getDb(): Database {
  if (!globalThis.__stuffsdrop_db) globalThis.__stuffsdrop_db = createDb();
  return globalThis.__stuffsdrop_db;
}

export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export * from "./schema";

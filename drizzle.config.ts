import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

/**
 * Schema pushes and migrations use DIRECT_URL (port 5432): the pooler
 * doesn't support DDL. The app itself connects through DATABASE_URL.
 *
 *   pnpm db:push       push schema straight to the database (dev)
 *   pnpm db:generate   write migration SQL to drizzle/
 *   pnpm db:migrate    apply migration files
 *   pnpm db:studio     browse data
 */
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
} satisfies Config;

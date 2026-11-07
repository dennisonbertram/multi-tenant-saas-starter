import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Single shared Postgres client.
 *
 * postgres.js pools connections internally, so one client per process is
 * correct. `max: 10` keeps us friendly to small database instances —
 * tune per deployment (see docs/DEPLOYMENT.md).
 *
 * `prepare: false` is required when connecting through transaction/system
 * poolers (e.g. Supabase, pgbouncer) and harmless otherwise.
 */
const client = postgres(env.DATABASE_URL, {
  max: 10,
  prepare: false,
  idle_timeout: 20,
});

export const db = drizzle(client, { schema });

export { schema };

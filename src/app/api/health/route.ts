import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/** Liveness/readiness probe for load balancers, uptime monitors, systemd. */
export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ status: "ok", database: "up" });
  } catch {
    return Response.json({ status: "ok", database: "down" }, { status: 503 });
  }
}

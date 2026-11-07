import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { requireOrgApi } from "@/lib/tenancy";
import { createProjectSchema, fieldErrors } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { rateLimit, clientIp } from "@/lib/auth/rate-limit";

/**
 * Example authenticated, org-scoped JSON API.
 *
 * Pattern for all API routes:
 * 1. requireOrgApi(req, minRole) — 401/403 handled for you.
 * 2. Validate the body with zod.
 * 3. Every query/mutation includes the organizationId predicate.
 *
 * CSRF note: cookie-based APIs must not accept cross-site writes. This route
 * relies on SameSite=Lax cookies + the Origin checks Next applies to server
 * actions; if you add more cookie-authenticated write endpoints behind other
 * hosts/proxies, add an explicit Origin check (see docs/SECURITY.md).
 */

export async function GET(req: Request) {
  const auth = await requireOrgApi(req);
  if (!auth.ok) return auth.response;

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.organizationId, auth.org.id))
    .orderBy(desc(projects.createdAt))
    .limit(50);

  return Response.json({ data: rows });
}

export async function POST(req: Request) {
  if (!rateLimit(`api-projects:${clientIp(req.headers)}`, { limit: 30, windowMs: 60_000 }).ok) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const auth = await requireOrgApi(req, "member");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", fields: fieldErrors(parsed.error) }, { status: 422 });
  }

  const [project] = await db
    .insert(projects)
    .values({
      organizationId: auth.org.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .returning();

  await audit({
    userId: auth.user.id,
    organizationId: auth.org.id,
    action: "project.created",
    metadata: { via: "api", projectId: project.id },
  });

  return Response.json({ data: project }, { status: 201 });
}

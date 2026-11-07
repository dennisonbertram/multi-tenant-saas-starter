import { z } from "zod";

/**
 * Shared validation schemas. Server actions and API routes validate every
 * input through these — single source of truth for what "valid" means.
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(320);

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(200);

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: emailSchema,
  password: passwordSchema,
  organizationName: z
    .string()
    .trim()
    .min(1, "Organization name is required")
    .max(100),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(200),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(200),
  password: passwordSchema,
});

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required").max(100),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required").max(100),
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(["admin", "member"]).default("member"),
});

export const roleChangeSchema = z.object({
  membershipId: z.string().uuid(),
  role: z.enum(["owner", "admin", "member"]),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const updateNameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(200),
  newPassword: passwordSchema,
});

export const changeEmailSchema = z.object({
  newEmail: emailSchema,
  currentPassword: z.string().min(1, "Current password is required").max(200),
});

/** Flatten a ZodError into { field: message } for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

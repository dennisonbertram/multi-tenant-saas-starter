import nodemailer, { type Transporter } from "nodemailer";
import { emailDevMode, env } from "@/lib/env";

/**
 * SMTP email via nodemailer — works with any provider or your own postfix.
 * No vendor SDK, no API keys beyond SMTP credentials.
 *
 * In development without SMTP_HOST configured, emails are logged to the
 * console (and the link is printed) so flows are testable with zero setup.
 */

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (emailDevMode) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE, // true for port 465, false for 587/STARTTLS
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  if (emailDevMode) {
    console.log(
      `\n📧 [dev email — not sent]\n   to: ${options.to}\n   subject: ${options.subject}\n${options.text}\n`,
    );
    return;
  }
  const t = getTransporter();
  if (!t) throw new Error("SMTP not configured but email send attempted");
  await t.sendMail({
    from: env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

// ── Email templates ─────────────────────────────────────────────────────────
// Plain-text-first templates: they render fine in any client and are easy to
// brand later. Keep links on their own line so mail clients don't mangle them.

export function sendVerificationEmail(to: string, name: string | null, link: string) {
  return sendEmail({
    to,
    subject: "Confirm your email address",
    text: [
      `Hi ${name ?? "there"},`,
      "",
      "Please confirm your email address by opening this link:",
      link,
      "",
      "The link expires in 24 hours.",
    ].join("\n"),
  });
}

export function sendPasswordResetEmail(to: string, link: string) {
  return sendEmail({
    to,
    subject: "Reset your password",
    text: [
      "Someone (hopefully you) requested a password reset.",
      "",
      "Open this link to choose a new password:",
      link,
      "",
      "The link expires in 1 hour. If you didn't request this, ignore this email.",
    ].join("\n"),
  });
}

export function sendInviteEmail(to: string, orgName: string, inviterName: string, link: string) {
  return sendEmail({
    to,
    subject: `You've been invited to join ${orgName}`,
    text: [
      `${inviterName} invited you to join ${orgName}.`,
      "",
      "Accept the invitation here:",
      link,
      "",
      "The invitation expires in 7 days.",
    ].join("\n"),
  });
}

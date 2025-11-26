import { env } from "@workspace/env";

/**
 * Check if an email is allowed.
 * @param email - The email to check.
 * @returns True if the email is allowed, false otherwise.
 */
export function isEmailAllowed(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  return env.ALLOWED_EMAIL_ADDRESSES.includes(normalizedEmail);
}

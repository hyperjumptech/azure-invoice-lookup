import { env } from "@workspace/env";

export const SESSION_COOKIE_NAME = "auth_session";

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number;
  path?: string;
}

/**
 * Get the session cookie options.
 * @returns The session cookie options.
 */
export function getSessionCookieOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 60 * 60 * 24, // 1 day in seconds
    path: "/",
  };
}

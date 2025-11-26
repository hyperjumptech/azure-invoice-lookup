import * as jose from "jose";
import { env } from "@workspace/env";

/**
 * Create a magic link token for the user.
 * @param email - The email of the user to create the magic link token for.
 * @returns A promise that resolves with the magic link token.
 */
export async function createMagicLinkToken(email: string): Promise<string> {
  const payload: jose.JWTPayload = {
    email: email.trim().toLowerCase(),
  };

  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(env.JWT_SECRET));
}

/**
 * Verify a magic link token created by createMagicLinkToken.
 * @param token - The magic link token to verify.
 * @returns A promise that resolves with the payload of the token.
 */
export async function verifyMagicLinkToken(
  token: string
): Promise<jose.JWTPayload> {
  const decoded = await jose.jwtVerify(
    token,
    new TextEncoder().encode(env.JWT_SECRET)
  );
  return decoded.payload;
}

/**
 * Create a session token for the user.
 * @param email - The email of the user to create the session token for.
 * @returns A promise that resolves with the session token.
 */
export async function createSessionToken(email: string): Promise<string> {
  const payload: jose.JWTPayload = {
    email: email.trim().toLowerCase(),
  };

  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(env.JWT_SECRET));
}

/**
 * Verify a session token created by createSessionToken.
 * @param token - The session token to verify.
 * @returns A promise that resolves with the payload of the token.
 */
export async function verifySessionToken(
  token: string
): Promise<jose.JWTPayload> {
  const decoded = await jose.jwtVerify(
    token,
    new TextEncoder().encode(env.JWT_SECRET)
  );
  return decoded.payload;
}

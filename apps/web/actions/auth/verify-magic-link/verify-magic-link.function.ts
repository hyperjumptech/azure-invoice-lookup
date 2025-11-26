import { cookies } from "next/headers";
import { z } from "zod";
import {
  verifyMagicLinkToken,
  createSessionToken,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
} from "@workspace/auth";
import { updateTag } from "next/cache";
import { logActivity } from "@/lib/log-activity";
import { JWTPayload } from "jose";

/**
 * The schema of the data for the verify magic link function.
 * @param token - The token to verify.
 */
export const verifyMagicLinkFunctionSchema = z.object({
  token: z.string().min(1, "Token is required"),
  ip_address: z.ipv4("Invalid IP address"),
  geo_data: z
    .string()
    .transform((val) => JSON.parse(val))
    .optional(),
});

/**
 * Verifies a magic link token and creates a session token if the token is valid.
 * @param data - The data to verify the magic link token for. @see verifyTokenSchema
 * @returns The result of the verify magic link operation.
 */
export async function verifyMagicLinkFunction(
  data: z.infer<typeof verifyMagicLinkFunctionSchema>
): Promise<{ success: boolean; error: string | null }> {
  let payload: JWTPayload | null = null;
  const {
    token: validatedToken,
    ip_address: validatedIpAddress,
    geo_data: validatedGeoData,
  } = data;
  try {
    payload = await verifyMagicLinkToken(validatedToken);

    if (!payload || typeof payload.email !== "string") {
      throw new Error("Invalid token");
    }

    const sessionToken = await createSessionToken(payload.email);
    const cookieOptions = getSessionCookieOptions();

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, cookieOptions);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Invalid request",
      };
    }

    return {
      success: false,
      error: `Failed to verify magic link: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }

  updateTag("login-logout-button");

  if (payload && typeof payload.email === "string") {
    try {
      await logActivity(
        "login",
        {
          email: payload.email,
          ipAddress: validatedIpAddress,
          geoData: validatedGeoData,
        },
        {
          email: payload.email,
        }
      );
    } catch (error) {
      console.error(error);
    }
  }

  return {
    success: true,
    error: null,
  };
}

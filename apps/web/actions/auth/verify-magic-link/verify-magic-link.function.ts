import { cookies } from "next/headers";
import { z } from "zod";
import {
  verifyMagicLinkToken,
  createSessionToken,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
} from "@workspace/auth";
import { updateTag } from "next/cache";

/**
 * The schema of the data for the verify magic link function.
 * @param token - The token to verify.
 */
export const verifyMagicLinkFunctionSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

/**
 * Verifies a magic link token and creates a session token if the token is valid.
 * @param data - The data to verify the magic link token for. @see verifyTokenSchema
 * @returns The result of the verify magic link operation.
 */
export async function verifyMagicLinkFunction(
  data: z.infer<typeof verifyMagicLinkFunctionSchema>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { token: validatedToken } = data;

    const payload = await verifyMagicLinkToken(validatedToken);

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

  return {
    success: true,
    error: null,
  };
}

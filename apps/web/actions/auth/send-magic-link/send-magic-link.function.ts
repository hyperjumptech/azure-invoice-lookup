import { z } from "zod";
import { isEmailAllowed, sendMagicLinkEmail } from "@workspace/auth";

/**
 * The schema of the data for the send magic link function.
 * @param email - The email address to send the magic link to.
 */
export const sendMagicLinkFunctionSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * Sends a magic link email to the user if the email address is allowed.
 * @param data - The data to send the magic link for. @see sendMagicLinkFunctionSchema
 * @returns The result of the send magic link operation.
 */
export async function sendMagicLinkFunction(
  data: z.infer<typeof sendMagicLinkFunctionSchema>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { email: validatedEmail } = data;

    if (!isEmailAllowed(validatedEmail)) {
      return {
        success: false,
        error: "Email address is not allowed",
      };
    }

    await sendMagicLinkEmail(validatedEmail);

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send magic link",
    };
  }
}

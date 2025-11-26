import { z } from "zod";
import { isEmailAllowed, sendMagicLinkEmail } from "@workspace/auth";
import { logActivity } from "@/lib/log-activity";

/**
 * The schema of the data for the send magic link function.
 * @param email - The email address to send the magic link to.
 */
export const sendMagicLinkFunctionSchema = z.object({
  email: z.email("Invalid email address"),
  ip_address: z.ipv4("Invalid IP address"),
  geo_data: z
    .string()
    .transform((val) => JSON.parse(val))
    .optional(),
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
    const {
      email: validatedEmail,
      ip_address: validatedIpAddress,
      geo_data: validatedGeoData,
    } = data;

    if (!isEmailAllowed(validatedEmail)) {
      return {
        success: false,
        error: "Email address is not allowed",
      };
    }

    const magicLink = await sendMagicLinkEmail(validatedEmail);

    try {
      await logActivity(
        "request-magic-link",
        {
          email: validatedEmail,
          ipAddress: validatedIpAddress,
          geoData: validatedGeoData,
        },
        {
          email: validatedEmail,
          link: magicLink,
        }
      );
    } catch (error) {
      console.error(error);
    }

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

import { SESSION_COOKIE_NAME } from "@workspace/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { updateTag } from "next/cache";

/**
 * The schema of the data for the logout function.
 * @param redirectTo - The URL to redirect to after logging out. Defaults to "/auth/login".
 */
export const logoutFunctionSchema = z.object({
  redirectTo: z.string().optional(),
});

/**
 * Logs out the user and redirects to the specified URL if provided, otherwise redirects to "/auth/login".
 * @param data - The data to logout in the shape of { redirectTo: string }. @see logoutFunctionSchema
 * @returns The result of the logout.
 */
export const logoutFunction = async (
  data: z.infer<typeof logoutFunctionSchema>
): Promise<{ success: false; error: string } | undefined> => {
  const redirectTo = data.redirectTo || "/auth/login";
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error("Error logging out", error);
    return {
      success: false,
      error: "Failed to logout",
    };
  }

  updateTag("login-logout-button");
  updateTag("get-session-email");
  updateTag("is-authenticated");
  redirect(redirectTo);
};

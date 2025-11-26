import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@workspace/auth";
import { cacheLife, cacheTag } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Gets the email of the authenticated user.
 *
 * @returns The email of the authenticated user, or null if the user is not authenticated
 */
export async function getSessionEmail(): Promise<string | null> {
  "use cache: private";
  cacheTag("get-session-email");
  cacheLife({ stale: 60 });
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    const payload = await verifySessionToken(sessionToken);
    return payload?.email as string | null;
  } catch (error) {
    console.error(error);
    // Invalid or expired token
    return null;
  }
}

/**
 * Checks if the user is authenticated.
 *
 * @returns True if the user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  "use cache: private";
  cacheTag("is-authenticated");
  cacheLife({ stale: 60 });
  const email = await getSessionEmail();
  return email !== null;
}

/**
 * A higher-order function that protects a function by checking if the user is authenticated.
 * If the user is not authenticated, it will redirect to the specified URL.
 *
 * @example
 * const protectedFunction = withAuth(function);
 * export default protectedFunction;
 *
 * @param func - The function to protect
 * @param isAuthenticatedFunc - The function to check if the user is authenticated
 * @param redirectTo - The URL to redirect to if the user is not authenticated
 * @returns The protected function
 */
export const withAuth = <Args extends unknown[], Output>(
  func: (...args: Args) => Promise<Output>,
  isAuthenticatedFunc: () => Promise<boolean> = isAuthenticated,
  redirectTo: string = "/auth/login"
) => {
  return async (...args: Args) => {
    const isLoggedIn = await isAuthenticatedFunc();
    if (!isLoggedIn) {
      redirect(redirectTo);
    }
    return func(...args);
  };
};

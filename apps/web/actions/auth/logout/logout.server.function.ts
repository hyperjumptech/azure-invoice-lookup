"use server";

import { withRequestValidation } from "@workspace/server-function-utils";
import { logoutFunction, logoutFunctionSchema } from "./logout.function";

/**
 * The server function for the logout action. Use this function from a client component to logout the user.
 * @example
 * ```ts
 * <Button onClick={() => {
 *   startTransition(() => {
 *     logoutServerFunction({ redirectTo: "/auth/login" });
 *   });
 * }}>Logout</Button>
 * ```
 */
export const logoutServerFunction = withRequestValidation(
  logoutFunction,
  logoutFunctionSchema
);

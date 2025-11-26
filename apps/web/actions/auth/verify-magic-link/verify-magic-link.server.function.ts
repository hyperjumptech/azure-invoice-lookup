"use server";

import { createFormAction } from "@workspace/server-function-utils";
import {
  verifyMagicLinkFunction,
  verifyMagicLinkFunctionSchema,
} from "./verify-magic-link.function";

/**
 * A form action that verifies a magic link token and creates a session token if the token is valid.
 * @example
 * ```ts
 * const [state, formAction, isPending, , payload] = useResettableActionState(verifyMagicLinkFormAction, { success: false, error: null });
 * return (
 *   <form action={formAction}>
 *     <input type="text" name="token" />
 *     <button disabled={isPending} type="submit">Submit</button>
 *     {state.error && <p>{state.error}</p>}
 *     {state.success && <p>Success!</p>}
 *   </form>
 * );
 * ```
 * @returns The form action.
 */
export const verifyMagicLinkFormAction = createFormAction(
  verifyMagicLinkFunction,
  verifyMagicLinkFunctionSchema
);

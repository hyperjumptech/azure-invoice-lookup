"use server";

import { createFormAction } from "@workspace/server-function-utils";
import {
  sendMagicLinkFunction,
  sendMagicLinkFunctionSchema,
} from "./send-magic-link.function";

/**
 * A form action that sends a magic link email to the user if the email address is allowed.
 * @example
 * ```ts
 * const [state, formAction, isPending, , payload] = useResettableActionState(sendMagicLinkFormAction, { success: false, error: null });
 * return (
 *   <form action={formAction}>
 *     <input type="email" name="email" />
 *     <button disabled={isPending} type="submit">Submit</button>
 *     {state.error && <p>{state.error}</p>}
 *     {state.success && <p>Success!</p>}
 *   </form>
 * );
 * ```
 * @returns The form action.
 */
export const sendMagicLinkFormAction = createFormAction(
  sendMagicLinkFunction,
  sendMagicLinkFunctionSchema
);

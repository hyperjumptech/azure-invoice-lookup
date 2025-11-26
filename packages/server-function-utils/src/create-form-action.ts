import { getFormData } from "./form";
import { z } from "zod";
import { withRequestValidation } from "./request-validation";

/**
 * A higher-order function that creates a form action.
 * @example
 * ```ts
 * const function = async (data: { name: string; age: number }) => {
 *   return { success: true };
 * };
 * const schema = z.object({ name: z.string(), age: z.number() });
 * const formAction = createFormAction(function, schema);
 * export default formAction;
 *
 * // Then you can use the form action like this:
 *
 * const [state, formAction, isPending, , payload] = useResettableActionState(formAction, { success: false, error: null });
 * return (
 *   <form action={formAction}>
 *     <input type="text" name="name" />
 *     <input type="number" name="age" />
 *     <button disabled={isPending} type="submit">Submit</button>
 *     {state.error && <p>{state.error}</p>}
 *     {state.success && <p>Success!</p>}
 *   </form>
 * );
 * ```
 * @param func - The function to create the form action for.
 * @param schema - The schema to validate the request against.
 * @returns The form action.
 */
export const createFormAction = <
  Args extends readonly unknown[],
  InputSchema extends z.ZodTypeAny,
  Output,
>(
  func: (...args: Args) => Promise<Output>,
  schema: InputSchema
) => {
  return async (_prevState: unknown, formData: FormData) => {
    const data = getFormData(formData);

    // @ts-expect-error - data is not typed but it will be validated by the schema
    return withRequestValidation(func, schema)(data);
  };
};

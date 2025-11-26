import { z } from "zod";

/**
 * A higher-order function that validates the request for a function. The motivation is for separation of concerns and to avoid repeating the validation code in every function. In the wrapped function, you can use the validated data directly. The wrapped function does not need to concern itself with the validation.
 * @example
 * ```ts
 * const function = async (data: { name: string; age: number }) => {
 *   return { success: true };
 * };
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 * });
 * const validatedFunction = withRequestValidation(function, schema);
 * export default validatedFunction;
 *
 * // Then you can use the validated function like this:
 * const result = await validatedFunction({ name: "John", age: 30 });
 * console.log(result); // { success: true }
 * ```
 * @param func - The function to validate the request for.
 * @param schema - The schema to validate the request against.
 * @returns The function with the request validated.
 */
export const withRequestValidation = <
  Args extends readonly unknown[],
  InputSchema extends z.ZodTypeAny,
  Output,
>(
  func: (...args: Args) => Promise<Output>,
  schema: InputSchema
) => {
  return async (...args: Args) => {
    // Validate the first argument when there's a single argument
    const inputToValidate = args.length === 1 ? args[0] : args;
    const validatedArgs = await schema.safeParseAsync(inputToValidate);
    if (!validatedArgs.success) {
      return {
        success: false,
        error: validatedArgs.error.message,
      };
    }
    // If we validated a single argument, pass it as the first argument
    // Otherwise, spread the validated data as arguments
    if (args.length === 1) {
      return await func(...([validatedArgs.data] as unknown as Args));
    }
    return await func(...(validatedArgs.data as unknown as Args));
  };
};

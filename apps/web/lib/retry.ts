/**
 * Options for configuring retry behavior with backoff delay.
 */
export type RetryOptions = {
  /**
   * Initial delay in milliseconds before the first retry.
   * @default 1000
   */
  initialDelayMs?: number;
  /**
   * Maximum delay in milliseconds between retries (caps exponential backoff).
   * @default 30000
   */
  maxDelayMs?: number;
  /**
   * Whether to use exponential backoff (doubles delay each attempt).
   * @default true
   */
  exponentialBackoff?: boolean;
};

/**
 * Wraps a promise and retries it if it rejects, up to a maximum number of attempts.
 * Supports exponential backoff delay between retries.
 *
 * @param promiseFactory - A function that returns a promise to execute and retry
 * @param maxAttempts - Maximum number of attempts (must be at least 1)
 * @param options - Optional retry configuration (backoff delay settings)
 * @returns A promise that resolves with the result of the promise factory, or rejects after all attempts fail
 *
 * @example
 * ```ts
 * // Simple retry with default exponential backoff
 * const result = await retry(
 *   () => fetch('https://api.example.com/data'),
 *   3
 * );
 *
 * // Custom backoff configuration
 * const result = await retry(
 *   () => fetch('https://api.example.com/data'),
 *   5,
 *   { initialDelayMs: 500, maxDelayMs: 10000 }
 * );
 * ```
 */
export async function retry<T>(
  promiseFactory: () => Promise<T>,
  maxAttempts: number,
  options?: RetryOptions
): Promise<T> {
  if (maxAttempts < 1) {
    throw new Error("maxAttempts must be at least 1");
  }

  const {
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    exponentialBackoff = true,
  } = options ?? {};

  if (initialDelayMs < 0) {
    throw new Error("initialDelayMs must be non-negative");
  }

  if (maxDelayMs < 0) {
    throw new Error("maxDelayMs must be non-negative");
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await promiseFactory();
    } catch (error) {
      lastError = error;

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const baseDelay = exponentialBackoff
        ? initialDelayMs * Math.pow(2, attempt - 1)
        : initialDelayMs;
      const delayMs = Math.min(baseDelay, maxDelayMs);

      // Wait before retrying (skip delay if it's 0)
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError;
}

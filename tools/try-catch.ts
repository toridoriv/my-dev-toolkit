import type { AnyFunction } from "https://cdn.jsdelivr.net/gh/toridoriv/my-dev-toolkit/tools/typings.ts";

/**
 * Tries to execute a function, catching any errors and returning a fallback value.
 *
 * This allows you to execute potentially error-prone code, while guaranteeing a safe
 * fallback value is returned if errors occur.
 *
 * @param fn - The function to try executing.
 * @param fallback - The fallback value to return on error.
 * @returns The return value of `fn` or the `fallback`.
 */
export function tryCatch<F extends AnyFunction>(
  fn: F,
  fallback: ReturnType<F>,
): ReturnType<F> {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

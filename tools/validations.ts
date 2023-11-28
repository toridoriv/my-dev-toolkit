const HTTP_URL_REGEX = /^(http|https):\/\//;

/**
 * Checks if a given string is a valid HTTP or HTTPS URL.
 *
 * @param value - The string to validate as an HTTP/HTTPS URL.
 * @returns A boolean indicating if the input is a valid HTTP/HTTPS URL.
 *
 * @example
 *
 * ```ts
 * import { isHttpUrl } from "./validations.ts";
 *
 * console.assert(isHttpUrl("https://example.com"));
 * console.assert(isHttpUrl("http://localhost:8080/path"));
 *
 * console.assert(isHttpUrl("foo") === false);
 * console.assert(isHttpUrl("ftp://example.com") === false);
 * console.assert(isHttpUrl("file://path-to-file") === false);
 * ```
 */
export function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);

    return HTTP_URL_REGEX.test(parsed.href);
  } catch {
    return false;
  }
}

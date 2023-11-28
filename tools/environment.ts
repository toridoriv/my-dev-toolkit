import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Gets an environment variable value and parses it using a Zod schema.
 *
 * The schema will transform the string value into the appropriate typed output.
 * If the value is invalid per the schema, it will throw a Zod error.
 *
 * @param name - The environment variable name.
 * @param schema - The Zod schema to use to parse the value.
 * @returns The parsed environment variable value.
 *
 * @example
 *
 * ```ts
 * import { getFromEnvironment } from "./environment.ts";
 *
 * const portSchema = z.coerce.number().default(8080);
 * const port = getFromEnvironment("PORT", portSchema);
 *
 * console.assert(typeof port === "number");
 * ```
 */
export function getFromEnvironment<S extends z.ZodTypeAny>(name: string, schema: S) {
  return schema.parse(Deno.env.get(name));
}

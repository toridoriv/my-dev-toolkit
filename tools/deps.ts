/**
 * @module dependencies - Frequently used third party libraries.
 */
export { deepMerge, filterKeys } from "https://deno.land/std@0.208.0/collections/mod.ts";
export { format as formatDate } from "https://deno.land/std@0.208.0/datetime/format.ts";
export { join as joinPaths, toFileUrl } from "https://deno.land/std@0.208.0/path/mod.ts";
//@deno-types="./deps/zod.d.ts";
import { default as zod } from "https://deno.land/x/zod@v3.22.4/index.ts";
import ansiColors from "https://esm.sh/ansi-colors@4.1.3";

/**
 * TypeScript-first schema validation with static type inference.
 *
 * Zod types are defined under the namespace {@link Zod}.
 * @see {@link [✨ Documentation ✨](https://zod.dev)}
 */
export const z = zod;

/**
 * Easily add ANSI colors to your text and symbols in the terminal.
 *
 * @see {@link [🌈 Documentation 🌈](https://github.com/doowb/ansi-colors)}
 */
export const ansicolors = ansiColors;

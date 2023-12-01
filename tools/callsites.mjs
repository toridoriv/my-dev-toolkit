/**
 * @module callsites
 * @description Utility functions for handling call sites.
 *
 * @browser ✅ Compatible with browsers
 * @deno    ✅ Compatible with Deno
 * @node    ✅ Compatible with Node.js
 * @bun     🟡 Partially compatible with Bun. When obtaining the `lineNumber`, `bun` skips white spaces and comments.
 */

// deno-lint-ignore no-unused-vars
import * as typings from "./typings.mjs";

/**
 * Array of known callSite methods.
 * @type {typings.CallSiteMethodName[]}
 */
const CALLSITE_METHODS = [
  "getThis",
  "getTypeName",
  "getFunction",
  "getFunctionName",
  "getMethodName",
  "getFileName",
  "getLineNumber",
  "getColumnNumber",
  "getEvalOrigin",
  "isToplevel",
  "isEval",
  "isNative",
  "isConstructor",
];

class StackOnlyError extends Error {}

/**
 * Retrieves an array of expanded call sites.
 *
 * Call sites are parsed to provide additional information about each call site.
 *
 * @param {Error} [error] - The error object from which call sites are to be retrieved. Defaults to a new Error object.
 * @returns {typings.ExpandedCallSite[]} Array of {@link ExpandedCallSite} providing detailed information about each call site.
 *
 * @example
 *
 * ```ts
 * import { callsites } from "./callsites.mjs";
 *
 * const sites = callsites();
 * const site = sites[0];
 *
 * console.assert(site.functionName === "file:///Users/Willow/Developer/Project/mod.ts");
 * console.assert(site.lineNumber === 5);
 * ```
 */
export function callsites(error = new StackOnlyError()) {
  const _prepareStackTrace = Error.prepareStackTrace;

  try {
    Error.prepareStackTrace = (_, callsites) => callsites;
    const stack = /** @type {typings.CallSite[]} */ (
      /** @type {unknown} */ (error.stack)
    );

    if (error instanceof StackOnlyError) {
      stack.shift();
    }

    return stack.filter(isNotInternal).map(parseCallsite);
  } finally {
    Error.prepareStackTrace = _prepareStackTrace;
  }
}

/**
 * Creates an object calling all available methods in a callSite.
 *
 * @param {typings.CallSite} cs - A call site.
 * @returns {typings.ExpandedCallSite} {@link ExpandedCallSite} providing detailed information about a call site.
 */
export function parseCallsite(cs) {
  const result = /** @type {typings.ExpandedCallSite} */ ({});

  CALLSITE_METHODS.forEach((method) => {
    const noGet = method.replace("get", "");
    const property = /** @type {typings.ExpandedCallSiteProperty} */ (
      noGet[0].toLowerCase() + noGet.substring(1)
    );

    // @ts-ignore: ¯\_(ツ)_/¯
    result[property] = cs[method]();
  });

  return result;
}

/**
 *
 * @param {typings.CallSite} cs
 * @returns {boolean}
 */
function isNotInternal(cs) {
  const filename = cs.getFileName();

  if (typeof filename === "undefined") return true;

  return !filename.startsWith("node:internal");
}

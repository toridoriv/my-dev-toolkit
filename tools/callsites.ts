import { AnyFunction } from "./typings.ts";

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
] as const;

/**
 * Represents detailed information about a call site in the call stack.
 *
 * This provides extended metadata beyond the standard CallSite interface,
 * including things like the function name, file path, line number, etc.
 *
 * Useful for logging, errors, and debugging. Allows inspecting the full
 * context of a call site programmatically.
 *
 * @example
 *
 * ```ts
 * import { callsites, ExpandedCallSite } from "./callsites.ts";
 *
 * const sites = callsites();
 * const site: ExpandedCallSite = sites[0];
 *
 * console.assert(site.functionName === "file:///Users/Willow/Developer/Project/mod.ts");
 * console.assert(site.lineNumber === 5);
 * ```
 */
export type ExpandedCallSite = {
  /**
   * The `this` value of the call site.
   */
  this: unknown;
  /**
   * The type name of `this`.
   */
  typeName: string | null;
  /**
   * The function being invoked at the call site.
   */
  function: AnyFunction | undefined;
  /**
   * The name of the function being invoked.
   */
  functionName: string | null;
  /**
   * The method name if it's a method call.
   */
  methodName: string | null;
  /**
   * The file path where the call site originated.
   */
  fileName: string | undefined;
  /**
   * The line number in the file where the call originated.
   */
  lineNumber: number | null;
  /**
   * The column number where the call originated.
   */
  columnNumber: number | null;
  /**
   * The eval origin if the call site originated in eval.
   */
  evalOrigin: string | undefined;
  /**
   * Whether this call site is at the top level of the call stack.
   */
  isTopLevel: boolean;
  /**
   * Whether the call site originated from eval.
   */
  isEval: boolean;
  /**
   * Whether the call site originated from native code.
   */
  isNative: boolean;
  /**
   * Whether the call site is from a constructor invocation.
   */
  isConstructor: boolean;
};

/**
 * Retrieves an array of expanded call sites.
 *
 * Call sites are parsed to provide additional information about each call site.
 *
 * @param error - The error object from which call sites are to be retrieved. Defaults to a new Error object.
 * @returns Array of {@link ExpandedCallSite} providing detailed information about each call site.
 *
 * @example
 *
 * ```ts
 * import { callsites, ExpandedCallSite } from "./callsites.ts";
 *
 * const sites = callsites();
 * const site: ExpandedCallSite = sites[0];
 *
 * console.assert(site.functionName === "file:///Users/Willow/Developer/Project/mod.ts");
 * console.assert(site.lineNumber === 5);
 * ```
 */
export function callsites(error = new Error()) {
  const _prepareStackTrace = Error.prepareStackTrace;
  try {
    Error.prepareStackTrace = (_, callsites) => {
      return callsites.map(parseCallsite);
    };

    return error.stack as unknown as ExpandedCallSite[];
  } finally {
    Error.prepareStackTrace = _prepareStackTrace;
  }
}

function parseCallsite(cs: NodeJS.CallSite) {
  const result = {} as ExpandedCallSite;

  CALLSITE_METHODS.forEach((method) => {
    const noGet = method.replace("get", "");
    const property = (noGet[0].toLowerCase() +
      noGet.substring(1)) as keyof ExpandedCallSite;

    // @ts-ignore: ¯\_(ツ)_/¯
    result[property] = cs[method]();
  });

  return result;
}

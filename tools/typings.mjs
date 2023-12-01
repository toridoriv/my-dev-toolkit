/**
 * @module typings
 */

/// <reference path="./global.d.ts" />

export {};

/**
 * Instead of adding a `disable` directive, use this value
 * to indicate that an any type is expected that way purposely.
 *
 * @typedef {*} SafeAny
 */

/**
 * Represents any possible array.
 *
 * @typedef {Array<SafeAny>} AnyArray
 */

/**
 * Represents a function that can accept any number of arguments
 * of any type and returns a value of any type.
 *
 * This is useful for representing loosely typed callback functions
 * where the arguments and return value are not known or relevant.
 *
 * @typedef {(...args: AnyArray) => SafeAny} AnyFunction
 */

/**
 * Represents an object type where the keys can be
 * either strings or numbers, and the values are any type.
 *
 * This is useful for representing loose object types where
 * the keys and values are not known ahead of time.
 *
 * @typedef {Record<string | number | symbol, SafeAny>} AnyRecord
 */

/**
 * Type representing an empty object type where all properties are `never`.
 * Useful for representing objects with no properties.
 *
 * @typedef {Record<string | number | symbol, never>} EmptyRecord
 */

/**
 * Takes a type `T` and expands it into an object type with the same properties as `T`.
 *
 * @template T
 * @typedef {T extends infer O ? { [K in keyof O]: O[K] } : never} Expand
 */

/**
 * Recursively expands a type T to an object type with all nested properties
 * mapped to their original types.
 *
 * This is like {@link Expand} but works recursively to expand nested object properties.
 *
 * @template T
 * @template Unless
 * @typedef {T extends object
 *   ? T extends infer O
 *     ? O extends Unless
 *       ? O
 *       : { [K in keyof O]: O[K] extends AnyFunction ? O[K] : ExpandRecursively<O[K], Unless> }
 *     : never
 *   : T} ExpandRecursively
 */

/**
 * Takes a union type `U` and transforms it into an intersection type.
 *
 * @template U
 * @typedef {(
 *   U extends unknown ? (arg: U) => 0 : never
 * ) extends (arg: infer I) => 0
 *   ? I
 *   : never} UnionToIntersection
 */

/**
 * Takes a union type `U` and extracts the last type in the union.
 *
 * @template U
 * @typedef {UnionToIntersection<
 *   U extends unknown ? (x: U) => 0 : never
 * > extends (x: infer L) => 0
 *   ? L
 *   : never} LastInUnion
 */

/**
 * Takes a union type `U` and transforms it into a tuple type.
 *
 * @template U
 * @typedef {U extends unknown ? (arg: U) => 0 : never extends (arg: infer I) => 0 ? I : never} UnionToTuple
 */

/**
 * Takes a type `T` and removes the `undefined` type from its properties.
 *
 * @template T
 * @typedef {[T] extends [undefined] ? T : Exclude<T, undefined>} RemoveUndefined
 */

/**
 * Takes an object type `T` and transforms it into an array of key-value pairs,
 * where each value has `undefined` removed.
 *
 * @template T
 * @typedef {{ [K in keyof T]-?: [K, RemoveUndefined<T[K]>]; }[keyof T]} ObjectEntries
 */

/**
 * Takes a string `S` and replaces all occurrences of substring `From` with substring `To`.
 *
 * @template {string} S
 * @template {string} From
 * @template {string} To
 * @typedef {From extends "" ? S : S extends `${infer R1}${From}${infer R2}` ? `${R1}${To}${ReplaceAll<R2, From, To>}` : S} ReplaceAll
 */

/**
 * Constructs a union type of the keys of the type `T`.
 *
 * @template T
 * @typedef {T extends Record<infer K, SafeAny> ? K & {} : never} KeyOf
 */

/**
 * Constructs a type where all properties are made non-nullable.
 *
 * Takes a type `T` and makes every property non-nullable by
 * removing `undefined` and `null` from its properties.
 *
 * @template T
 * @typedef {{ [K in keyof T]: NonNullable<T[K]> }} AllNonNullable
 */

/**
 * Represents a stack frame.
 *
 * @typedef {Object} CallSite
 * @property {function(): unknown} getThis - Value of "this".
 * @property {function(): string | null} getTypeName - Type of "this" as a string.
 * @property {function(): CallableFunction | undefined} getFunction - Current function.
 * @property {function(): string | null} getFunctionName - Name of the current function.
 * @property {function(): string | null} getMethodName - Name of the property [of "this" or one of its prototypes] that holds the current function.
 * @property {function(): string | undefined} getFileName - Name of the script [if this function was defined in a script].
 * @property {function(): number | null} getLineNumber - Current line number [if this function was defined in a script].
 * @property {function(): number | null} getColumnNumber - Current column number [if this function was defined in a script].
 * @property {function(): string | undefined} getEvalOrigin - A call site object representing the location where eval was called [if this function was created using a call to eval].
 * @property {function(): boolean} isToplevel - Is this a toplevel invocation, that is, is "this" the global object?
 * @property {function(): boolean} isEval - Does this call take place in code defined by a call to eval?
 * @property {function(): boolean} isNative - Is this call in native V8 code?
 * @property {function(): boolean} isConstructor - Is this a constructor call?
 */

/**
 * Method names of a {@link CallSite}.
 *
 * @typedef {KeyOf<CallSite>} CallSiteMethodName
 */

/**
 * Represents detailed information about a call site in the call stack.
 *
 * This provides extended metadata beyond the standard CallSite interface,
 * including things like the function name, file path, line number, etc.
 *
 * Useful for logging, errors, and debugging. Allows inspecting the full
 * context of a call site programmatically.
 *
 * @typedef {Object} ExpandedCallSite
 * @property {unknown} this - The `this` value of the call site.
 * @property {string | null} typeName - The type name of `this`.
 * @property {AnyFunction | undefined} function - The function being invoked at the call site.
 * @property {string | null} functionName - The name of the function being invoked.
 * @property {string | null} methodName - The method name if it's a method call.
 * @property {string | undefined} fileName - The file path where the call site originated.
 * @property {number | null} lineNumber - The line number in the file where the call originated.
 * @property {number | null} columnNumber - The column number where the call originated.
 * @property {string | undefined} evalOrigin - The eval origin if the call site originated in eval.
 * @property {boolean} isTopLevel - Whether this call site is at the top level of the call stack.
 * @property {boolean} isEval - Whether the call site originated from eval.
 * @property {boolean} isNative - Whether the call site originated from native code.
 * @property {boolean} isConstructor - Whether the call site is from a constructor invocation.
 */

/**
 * Property names of an {@link ExpandedCallSite}.
 *
 * @typedef {KeyOf<ExpandedCallSite>} ExpandedCallSiteProperty
 */

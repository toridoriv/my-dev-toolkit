/**
 * Instead of adding a `disable` directive, use this value
 * to indicate that an any type is expected that way purposely.
 */
// deno-lint-ignore no-explicit-any
export type SafeAny = any;

/**
 * Represents any possible array.
 */
export type AnyArray = Array<SafeAny>;

/**
 * Represents a function that can accept any number of arguments
 * of any type and returns a value of any type.
 *
 * This is useful for representing loosely typed callback functions
 * where the arguments and return value are not known or relevant.
 */
export type AnyFunction = (...args: AnyArray) => SafeAny;

/**
 * Represents an object type where the keys can be
 * either strings or numbers, and the values are any type.
 *
 * This is useful for representing loose object types where
 * the keys and values are not known ahead of time.
 */
export type AnyRecord = Record<string | number | symbol, SafeAny>;

/**
 * Type representing an empty object type where all properties are `never`.
 * Useful for representing objects with no properties.
 */
export type EmptyRecord = Record<string | number | symbol, never>;

/**
 * Takes a type `T` and expands it into an object type with the same properties as `T`.
 *
 * @param T - The type to be expanded.
 *
 * @see {@link https://stackoverflow.com/a/69288824/62937 Source}
 */
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

/**
 * Recursively expands a type T to an object type with all nested properties
 * mapped to their original types.
 *
 * This is like {@link Expand} but works recursively to expand nested object properties.
 *
 * @template T - The type to expand.
 * @template Unless - Optional types that should not be expanded.
 */
export type ExpandRecursively<T, Unless = null> = T extends object
  ? T extends infer O
    ? O extends Unless
      ? O
      : {
          [K in keyof O]: O[K] extends AnyFunction
            ? O[K]
            : ExpandRecursively<O[K], Unless>;
        }
    : never
  : T;

/**
 * Takes a union type `U` and transforms it into an intersection type.
 *
 * @param U - The union type to be transformed.
 */
export type UnionToIntersection<U> = (U extends unknown ? (arg: U) => 0 : never) extends (
  arg: infer I,
) => 0
  ? I
  : never;

/**
 * Takes a union type `U` and extracts the last type in the union.
 *
 * @param U - The union type from which to extract the last type.
 */
export type LastInUnion<U> = UnionToIntersection<
  U extends unknown ? (x: U) => 0 : never
> extends (x: infer L) => 0
  ? L
  : never;

/**
 * Takes a union type `U` and transforms it into a tuple type.
 *
 * @param U - The union type to be transformed into a tuple.
 */
export type UnionToTuple<U, Last = LastInUnion<U>> = [U] extends [never]
  ? []
  : [...UnionToTuple<Exclude<U, Last>>, Last];

/**
 * Takes a type `T` and removes the `undefined` type from its properties.
 *
 * @param T - The type from which to remove `undefined`.
 */
export type RemoveUndefined<T> = [T] extends [undefined] ? T : Exclude<T, undefined>;

/**
 * Takes an object type `T` and transforms it into an array of key-value pairs,
 * where each value has `undefined` removed.
 *
 * @param T - The object type from which to extract key-value pairs.
 */
export type ObjectEntries<T> = {
  [K in keyof T]-?: [K, RemoveUndefined<T[K]>];
}[keyof T];

/**
 * Takes a string `S` and replaces all occurrences of substring `From` with substring `To`.
 *
 * @param S - The string in which to perform replacements.
 * @param From - The substring to be replaced.
 * @param To - The substring to replace occurrences of `From`.
 */
export type ReplaceAll<
  S extends string,
  From extends string,
  To extends string,
> = From extends ""
  ? S
  : S extends `${infer R1}${From}${infer R2}`
  ? `${R1}${To}${ReplaceAll<R2, From, To>}`
  : S;

/**
 * Constructs a union type of the keys of the type `T`.
 *
 * @template T - The type to extract keys from.
 */
export type KeyOf<T> = T extends Record<infer K, SafeAny> ? K & {} : never;

/**
 * Constructs a type where all properties are made non-nullable.
 *
 * Takes a type `T` and makes every property non-nullable by
 * removing `undefined` and `null` from its properties.
 *
 * @example
 *
 * ```ts
 * type User = {
 *   id: number | undefined;
 *   name: string | null;
 * }
 *
 * type StrictUser = AllNonNullable<User>;
 *
 * // StrictUser is now:
 * // {
 * //   id: number;
 * //   name: string;
 * // }
 * ```
 */
export type AllNonNullable<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};

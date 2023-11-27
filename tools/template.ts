import type {
  Expand,
  ObjectEntries,
  ReplaceAll,
  UnionToTuple,
} from "https://cdn.jsdelivr.net/gh/toridoriv/my-dev-toolkit/tools/typings.ts";
import { deepMerge, filterKeys } from "https://deno.land/std@0.208.0/collections/mod.ts";

/**
 * Template class that allows rendering a string template with placeholders.
 *
 * The template string passed to the constructor can contain placeholders
 * surrounded by `{}` braces. These placeholders can then be replaced by
 * calling `render()` and passing an object with keys matching the placeholder names.
 *
 * Partial renders are also supported via `partialRender()`.
 *
 * @example
 *
 * ```ts
 * import { Template } from "./template.ts";
 *
 * const template = new Template("{salute} {name}!");
 * const rendered = template.render({ salute: "Hello", name: "World" });
 *
 * console.assert(rendered === "Hello World!");
 *
 * const partial = template.partialRender({ salute: "Bye" });
 *
 * console.assert(`${partial}` === "Bye {name}!");
 * ```
 */
export class Template<T extends string> extends String {
  /**
   * Regular expression to match placeholder syntax in the template string.
   * Looks for strings surrounded by `{}` braces.
   */
  static readonly placeholderRegex = /{.+?}/g;

  readonly replacements: Template.Replacements<T>;

  /**
   * Creates a new Template instance with the given template string value.
   *
   * @param value - The template string containing placeholders.
   * @param defaults - Optional object to fallback when not all replacements are given.
   *
   * @example
   *
   * ```ts
   * import { Template } from "./template.ts";
   *
   * const template = new Template("Hello {name}!");
   *
   * console.assert(`${template}` === "Hello {name}!");
   * ```
   */
  public constructor(value: T, defaults?: Template.PartialReplacements<T>) {
    super(value);

    this.replacements = (defaults || {}) as Template.Replacements<T>;
  }

  #render(replacements: Template.PartialReplacements<T>, useDefaults = true): string {
    let endValue = new String(this) as string;
    const rep = useDefaults ? deepMerge(this.replacements, replacements) : replacements;

    for (const key in rep) {
      const template = `{${key}}`;

      endValue = endValue.replaceAll(template, rep[key] as string);
    }

    return endValue.trim();
  }

  #validate(value: string) {
    const placeholders = Array.from(value.matchAll(Template.placeholderRegex)).map(
      (v) => v[0],
    );

    if (placeholders.length !== 0) {
      throw new Error("Some placeholders haven't been replaced yet", {
        cause: {
          template: `${this}`,
          result: value,
          missingReplacements: placeholders,
        },
      });
    }
  }

  /**
   * Renders the template string by replacing placeholders with provided values.
   *
   * Loops through the `replacements` object and replaces each placeholder
   * surrounded by `{}` in the template with the corresponding value.
   *
   * @param replacements - Object with keys matching placeholders and substitute values.
   * @returns Rendered string with all placeholders replaced.
   *
   * @example
   *
   * ```ts
   * import { Template } from "./template.ts";
   *
   * const template = new Template("Hello {name}!");
   * const rendered = template.render({name: "World"});
   *
   * console.assert(rendered === "Hello World!");
   * ```
   */
  public render(replacements: Template.PartialReplacements<T>): string {
    const result = this.#render(replacements);

    this.#validate(result);

    return result;
  }

  /**
   * Partially renders the template string with the given replacements.
   *
   * This creates a new Template instance with the template string rendered with
   * the provided partial replacements. Any placeholders that were not replaced
   * will remain in the new template string.
   *
   * @param replacements - Partial replacements to apply to the template string
   * @returns A new Template instance with the partial replacements rendered
   *
   * @example
   *
   * ```ts
   * import { Template } from "./template.ts";
   *
   * const template = new Template("Hello {name}! My name is {assistant}.");
   * const partial = template.partialRender({ name: "Human" });
   *
   * console.assert(`${partial}` === "Hello Human! My name is {assistant}.");
   * ```
   */
  public partialRender<R extends Template.PartialReplacements<T>>(replacements: R) {
    type NT = Template.ApplyReplacements<T, R>;
    // @ts-ignore: ¯\_(ツ)_/¯
    const nt = this.#render(replacements, false) as NT;
    const defaults = filterKeys(this.replacements, (k) => !(k in replacements));

    return new Template(nt, defaults as Template.Replacements<NT>);
  }
}

// deno-lint-ignore no-namespace
export namespace Template {
  /**
   * Type mapping string template placeholders to their
   * possible replacement values.
   *
   * @example
   *
   * ```ts
   * import { Template } from "./template.ts";
   *
   * type TemplateString = "Hello {name}!";
   * const replacements: Template.Replacements<TemplateString> = { name: "Peter" };
   * ```
   */
  export type Replacements<T extends string> = Expand<{
    [K in ExtractTemplatePlaceholders<T>[number]]: string | number | boolean;
  }>;

  /**
   * Same as {@link Template.Replacements} but all properties are marked as optional.
   */
  export type PartialReplacements<T extends string> = Partial<Replacements<T>>;

  /**
   * Represents the application of replacements to a template string.
   * It takes a template string (`T`) and a set of replacements (`R`) and
   * produce a new string with the specified replacements applied.
   *
   * @param T - A template string.
   * @param R - An object containing key-value pairs.
   *
   * @example
   *
   * ```ts
   * import { Template } from "./template.ts";
   *
   * type TemplateString = "Hello {name}!";
   * type Replacements = { name: "Peter" };
   * type Result = Template.ApplyReplacements<TemplateString, Replacements>;
   *
   * const result: Result = "Hello Peter!";
   * ```
   */
  export type ApplyReplacements<T extends string, R> = UnionToTuple<
    ObjectEntries<R>
  > extends ReplacementPair[]
    ? ReplaceAllInTemplate<T, UnionToTuple<ObjectEntries<R>>>
    : T;

  /**
   * @ignore
   */
  type ExtractTemplatePlaceholders<
    T extends string,
    Cache extends string[] = [],
  > = T extends MultiPlaceholderTemplate
    ? T extends `${string}{${infer S}}${infer Rest}`
      ? ExtractTemplatePlaceholders<Rest, [...Cache, S]>
      : Cache
    : Cache;

  /**
   * @ignore
   */
  type ReplacementPair = [string, string | number | boolean];

  /**
   * @ignore
   */
  type ApplyReplacementToTemplate<
    T extends string,
    Rep extends ReplacementPair,
    Cache extends string = T,
    Templates extends string[] = ExtractTemplatePlaceholders<Cache>,
  > = Rep[0] extends Templates[number] ? ReplaceAll<T, `{${Rep[0]}}`, `${Rep[1]}`> : T;

  /**
   * @ignore
   */
  type ReplaceAllInTemplate<
    T extends string,
    Rep extends ReplacementPair[],
  > = Rep["length"] extends 0
    ? T
    : Rep extends [infer F, ...infer R]
    ? F extends ReplacementPair
      ? R extends ReplacementPair[]
        ? ReplaceAllInTemplate<ApplyReplacementToTemplate<T, F>, R>
        : ReplaceAllInTemplate<ApplyReplacementToTemplate<T, F>, []>
      : T
    : T;

  /**
   * @ignore
   */
  type SinglePlaceholderTemplate = `{${string}}`;

  /**
   * @ignore
   */
  type MultiPlaceholderTemplate = `${string}${SinglePlaceholderTemplate}${string}`;
}

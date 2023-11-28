// deno-lint-ignore-file no-namespace
import { Logger } from "https://cdn.jsdelivr.net/gh/toridoriv/my-dev-toolkit/tools/logger.ts";
import {
  Expand,
  KeyOf,
} from "https://cdn.jsdelivr.net/gh/toridoriv/my-dev-toolkit/tools/typings.ts";

/**
 * Helper function that defines command options for a CLI command.
 * Mainly to facilitate IDE code prompts.
 *
 * @param options - The command options to define.
 * @returns The defined command options.
 * @template F - The type of command flags.
 * @template A - The type of command arguments.
 */
export function defineCommandOptions<
  F extends CommandOptions.Flags,
  A extends CommandOptions.Arguments,
>(options: CommandOptions<F, A>) {
  return options;
}

/**
 * @namespace CommandOptions - Contains types and interfaces for defining CLI command options.
 */
export namespace CommandOptions {
  /**
   * Interface representing an argument for a CLI command.
   */
  export interface Argument {
    /**
     * The name property defines the argument name.
     */
    name: string;
    /**
     * The type property defines the expected type for the argument value.
     *
     * It should be one of the types from the {@link TypeMap}.
     */
    type: KeyOf<TypeMap>;
  }

  /**
   * Type representing the possible combinations of command arguments.
   */
  export type Arguments =
    | [Argument]
    | [Argument, Argument]
    | [Argument, Argument, Argument];

  /**
   * Interface representing global options applicable to all CLI commands.
   */
  export type GlobalOptions = {
    /**
     * The path to the DenoManage bin directory.
     */
    binDir?: string;
    /**
     * The Deno Deploy project ID.
     */
    projectId: string;
    /**
     * The Deno Deploy access token.
     */
    deployToken: string;
    /**
     * Whether to do a dry run (don't execute side effects).
     */
    dryRun: boolean;
    /**
     * A comma-separated list of globs that should be excluded from deployment.
     * Any files/directories matching these globs will not be uploaded during deployment.
     */
    deployExclusions: string;
    /**
     * The path to the import map file, if one is being used.
     */
    importMapPath?: string;
    /**
     * The path to the `GITHUB_OUTPUT` path.
     */
    githubOutput?: string;
  };

  /**
   * Interface representing a flag for a CLI command.
   */
  export interface Flag {
    /**
     * The full name of the flag.
     */
    name: string;
    /**
     * A short one letter abbreviation for the flag.
     */
    abbreviation?: string;
    /**
     * The type of the flag value.
     */
    type: KeyOf<TypeMap>;
    /**
     * A description of the flag.
     */
    description: string;
    /**
     * Additional options like default value.
     */
    options?: FlagOptions;
  }

  /**
   * Type representing a collection of flags for a CLI command.
   *
   */
  export type Flags = Record<string, Flag>;

  /**
   * Type representing the action function for a CLI command.
   * @template F - The type of command flags.
   * @template A - The type of command arguments.
   */
  export type Action<F, A = unknown> =
    /**
     * @param options - The parsed options from defined flags
     * @param args - The parsed positional arguments
     *
     * @returns A promise resolving when the action is completed
     */
    (
      options: ActionParametersWithFlags<F>[0],
      ...args: ActionParametersWithArguments<A>
    ) => void | Promise<void>;

  /**
   * Type representing action parameters with flags for a CLI command.
   * @template F - The type of command flags.
   *
   * @ignore
   */
  type ActionParametersWithFlags<F> = F extends Flags
    ? [options: Expand<InferOptionsFromFlags<F> & GlobalOptions>]
    : [options: GlobalOptions];

  /**
   * Type representing action parameters with arguments for a CLI command.
   * @template A - The type of command arguments.
   *
   * @ignore
   */
  type ActionParametersWithArguments<A> = A extends Arguments
    ? A["length"] extends 1
      ? [TypeMap[A[0]["type"]]]
      : A["length"] extends 2
      ? // @ts-ignore: ¯\_(ツ)_/¯
        [TypeMap[A[0]["type"]], TypeMap[A[1]["type"]]]
      : A["length"] extends 3
      ? // @ts-ignore: ¯\_(ツ)_/¯
        [TypeMap[A[0]["type"]], TypeMap[A[1]["type"]], TypeMap[A[2]["type"]]]
      : []
    : [];

  /**
   * Type representing options for a CLI command flag.
   *
   * @ignore
   */
  type FlagOptions = {
    hidden?: boolean;
    default?: unknown;
    required?: boolean;
    standalone?: boolean;
    depends?: string[];
    collect?: boolean;
  };

  /**
   * Type representing the inferred options from CLI command flags.
   * @template F - The type of command flags.
   *
   * @ignore
   */
  type InferOptionsFromFlags<F extends Flags> = Expand<
    InferRequiredOptionsFromFlag<F> & InferOptionalOptionsFromFlag<F>
  >;

  /**
   * Type representing the inferred required options from CLI command flags.
   * @template F - The type of command flags.
   *
   * @ignore
   */
  type InferRequiredOptionsFromFlag<F extends Flags> = {
    [K in keyof F as IsOptionalFlag<F[K]> extends true
      ? never
      : K]: TypeMap[F[K]["type"]];
  };

  /**
   * Type representing the inferred optional options from CLI command flags.
   * @template F - The type of command flags.
   *
   * @ignore
   */
  type InferOptionalOptionsFromFlag<F extends Flags> = {
    [K in keyof F as IsOptionalFlag<F[K]> extends false
      ? never
      : K]?: TypeMap[F[K]["type"]];
  };

  /**
   * Type representing whether a CLI command flag is optional.
   * @template F - The type of command flags.
   *
   * @ignore
   */
  type IsOptionalFlag<F extends Flag> = F["options"] extends FlagOptions
    ? F["options"]["required"] extends true
      ? false
      : true
    : false;

  /**
   * Type representing the mapping of types for CLI command options.
   *
   * @ignore
   */
  type TypeMap = {
    string: string;
    number: number;
    boolean: boolean;
    file: string;
    integer: number;
    version: "major" | "minor" | "patch";
  };
}

/**
 * @interface CommandOptions - Represents the options for a CLI command.
 * @template F - The type of command flags.
 * @template A - The type of command arguments.
 */
export interface CommandOptions<F, A> {
  /**
   * The name of the command.
   */
  name: string;
  /**
   *  A description of what the command does.
   */
  description: string;
  /**
   * The function to run for the command.
   */
  action: CommandOptions.Action<F, A>;
  /**
   * Optional array of command line arguments for the command.
   * Each argument is defined using the {@link CommandOptions.Argument} interface.
   */
  arguments?: A extends CommandOptions.Arguments ? A : never;
  /**
   * Optional CLI flags for the command.
   */
  flags?: F extends CommandOptions.Flags ? F : never;
}

declare global {
  /**
   * Global logger instance available to any command.
   */
  // deno-lint-ignore no-var
  var logger: Logger;
}

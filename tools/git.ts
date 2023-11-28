// deno-lint-ignore-file no-namespace
import z from "https://deno.land/x/zod@v3.22.4/index.ts";
import { emojiCharToCode } from "./emoji.ts";
import { executeCommand } from "./process.ts";
import { Template } from "./template.ts";
import { Expand } from "./typings.ts";

Object.defineProperty(globalThis, "executeCommand", { value: executeCommand });

const TrimmedStringSchema = z.string().trim();

/**
 * Defines the schema for a Git commit object using Zod.
 * The schema validates and parses the commit data into a typed object.
 */
export const CommitSchema = z
  .object({
    /**
     * The commit hash.
     */
    hash: TrimmedStringSchema,
    /**
     * The commit ID - the short hash.
     */
    id: TrimmedStringSchema,
    /**
     * The commit timestamp.
     */
    timestamp: z.preprocess(parseDate, z.date()),
    /**
     * The author of the commit, containing their name and email address.
     */
    author: z.object({
      name: TrimmedStringSchema,
      email: TrimmedStringSchema,
    }),
    /**
     * The commit subject line.
     */
    subject: TrimmedStringSchema,
    /**
     * The commit reference - the branch or tag name.
     */
    ref: TrimmedStringSchema,
  })
  .transform(parseSubject);

/**
 * The Commit type, which represents a parsed Git commit.
 */
export type Commit = z.TypeOf<typeof CommitSchema>;

function parseDate(date: unknown) {
  const asNumber = Number(date);

  if (!Number.isNaN(asNumber)) {
    return new Date(asNumber * 1000);
  }

  return new Date(date as string);
}

function parseSubject<T extends { subject: string }>(commit: T) {
  commit.subject = emojiCharToCode(commit.subject);

  return commit;
}

export type GitDefaultOptions = Expand<Omit<Deno.CommandOptions, "args">>;

const commitFormat = {
  hash: "%H",
  id: "%h",
  timestamp: "%ad",
  author: {
    name: "%an",
    email: "%ae",
  },
  subject: "%s",
  ref: "%D",
};

const parameters = new Template("...options, ...{defaults}");

export interface Git extends Function {
  (options: Deno.CommandOptions): string;
}

/**
 * Git class to execute Git commands programmatically.
 *
 * Wraps Git CLI commands and handles parsing their output.
 *
 * @example
 *
 * ```ts
 * import { Git } from "./git.ts";
 *
 * const git = new Git();
 * const commits = git.log();
 *
 * console.assert(Array.isArray(commits) === true);
 * ```
 */
export class Git extends Function {
  readonly cwd: string;
  /**
   * @param options - Default options to pass to every Git command.
   */
  constructor(readonly options: GitDefaultOptions = {}) {
    const params = parameters.render({
      defaults: JSON.stringify(options),
    });
    const body = `return executeCommand('git', { ${params} });`;

    super("options", body);

    if (options.cwd instanceof URL) {
      this.cwd = options.cwd.href;
    } else {
      this.cwd = options.cwd || Deno.cwd();
    }
  }

  /**
   * Adds files to the Git index (staging area).
   *
   * Executes `git add` on the given file paths.
   *
   * @param paths - File paths to add.
   *
   * @example
   *
   * ```ts
   * import { Git } from "./git.ts";
   *
   * const git = new Git();
   *
   * git.add("file.txt");
   * ```
   */
  public add(...paths: string[]) {
    return this({ args: ["add"].concat(paths) });
  }

  /**
   * Commits changes with the given message.
   *
   * Executes `git commit -m <message>`.
   *
   * @param message - Commit message
   *
   * @example
   *
   * ```ts
   * import { Git } from "./git.ts";
   *
   * const git = new Git();
   *
   * git.commit("Implement feature X");
   * ```
   */
  public commit(message: string, flags: Git.CommitFlags = {}) {
    const args = this.parseFlags(flags, true).filter(Boolean);

    return this({ args: ["commit", "-m", message, ...args] });
  }

  /**
   * Sets or retrieves a Git configuration value.
   *
   * @param name - The name of the configuration setting to set.
   * @param value - The value to set, if any.
   *
   * @example
   *
   * ```ts
   * import { Git } from "./git.ts";
   *
   * const git = new Git();
   *
   * git.config("user.name", "John Doe");
   *
   * const userName = git.config("user.name");
   *
   * console.assert(userName === "John Doe");
   * ```
   */
  public config(name: string, value?: string) {
    return this({ args: ["config", name, value as string].filter(Boolean) });
  }

  /**
   * Initializes a new Git repository.
   *
   * Executes the `git init` command to create a new Git repository
   * in the current working directory.
   *
   * @param flags - Flags to pass to `git init`.
   *
   * @example
   *
   * ```ts
   * import { Git } from "./git.ts";
   *
   * const git = new Git();
   *
   * // Initialize a new repo
   * git.init();
   * ```
   */
  public init(flags: Git.InitFlags = {}) {
    const args = this.parseFlags(flags);

    return this({ args: ["init", ...args] });
  }

  /**
   * Gets the commit history from the Git repository.
   *
   * Executes `git log` to retrieve commit data and parses the output.
   *
   * @param flags - Flags to pass to `git log` to customize output.
   * @param revisionRange - The commit range to get logs for, e.g. "main...dev".
   * @returns The commit history as {@link Commit}[] sorted chronologically.
   *
   * @example
   *
   * ```ts
   * import { Git } from "./git.ts";
   *
   * const git = new Git();
   * const commits = git.log({maxCount: "5"});
   *
   * console.assert(typeof commits[0].subject === "string");
   * ```
   */
  public log(flags: Git.LogFlags = {}, revisionRange?: Git.LogRevisionRange) {
    const args = this.parseFlags(flags, true);

    if (revisionRange) {
      const ranges = revisionRange.split(" ").filter(Boolean);

      args.push(...ranges);
    }

    args.push(`--pretty=format:${JSON.stringify(commitFormat)}`);

    const output = this({ args: ["log", ...args] });

    return this.#parseLogOutput(output);
  }

  protected parseFlag(name: string, value?: string, takesValue = false) {
    const flagName =
      "--" +
      name
        .split(/([A-Z][a-z]+)/)
        .map(Function.prototype.call, String.prototype.toLowerCase)
        .filter(Boolean)
        .join("-");

    if (!value) {
      return [flagName];
    }

    if (!takesValue) {
      return [flagName, value];
    }

    return [`${flagName}=${value}`];
  }

  protected parseFlags(flags: Record<string, unknown>, takesValue = false) {
    const items: string[][] = [];

    for (const flag in flags) {
      const value = (typeof flags[flag] === "string" ? flags[flag] : undefined) as
        | string
        | undefined;

      items.push(this.parseFlag(flag, value, takesValue));
    }

    return items.flat();
  }

  #parseLogOutput(output: string) {
    const rawCommits = output
      .split(`{"hash"`)
      .filter(Boolean)
      .map((v) => `{"hash"${v}`);

    return rawCommits.map((c) => CommitSchema.parse(JSON.parse(c)));
  }
}

export namespace Git {
  /**
   * Options for committing a change to a Git repository.
   */
  export type CommitFlags = {
    /**
     * Override the author date used in the commit.
     */
    date?: string;
  };

  /**
   * Options for initializing a Git repository.
   */
  export type InitFlags = {
    /**
     * Use the specified name for the initial branch in the newly created repository.
     * If not specified, fall backs to the default name.
     */
    initialBranch?: string;
    /**
     * Only print error and warning messages; all other output will be suppressed.
     */
    quiet?: true;
  };

  /**
   * Options for customizing the output of `git log`.
   */
  export type LogFlags = {
    /**
     * Abbreviate the commit SHA hash to a shorter unique prefix.
     */
    abbrevCommit?: true;
    /**
     * Pretend as if all the refs in __refs/__, along with **HEAD**, are listed on the command line as <commit>.
     */
    all?: true;
    /**
     * Date format.
     * - **relative**: shows dates relative to the current time, e.g. "2 hours ago".
     * - **local**: alias for `--date=default-local`.
     * - **iso**: shows timestamps in a ISO 8601-like format. The differences to the strict ISO 8601 format are:
     *    - a space instead of the T date/time delimiter.
     *    - a space between time and time zone.
     *    - no colon between hours and minutes of the time zone.
     * - **iso-strict**: shows timestamps in strict ISO 8601 format.
     * - **short**: shows only the date, but not the time, in YYYY-MM-DD format.
     */
    date?: "relative" | "local" | "iso" | "iso-strict" | `format:${string}` | "short";
    /**
     * When finding commits to include, follow only the first parent
     * commit upon seeing a merge commit.
     */
    firstParent?: true;
    /**
     * Use mailmap file to map author and committer names and email addresses to canonical real names and email addresses.
     */
    mailmap?: true;
    /**
     * Limit the number of commits to output.
     */
    maxCount?: `${number}`;
    /**
     * Do not use mailmap.
     */
    noUseMailMap?: true;
    /**
     * Skip `n` commits before starting to show the commit output.
     */
    skip?: `${number}`;
    /**
     * Optional tags to filter the git log output by. Can be set to `true` to show all tags,
     * or a string to show a specific tag.
     */
    tags?: true | string;
  };

  /**
   * Defines the valid revision ranges that can be passed to `git log`.
   * A revision range specifies the set of commits to include in the log output.
   * This can be a single commit reference, two commit references separated by a space,
   * or two commit references separated by ^ or ... indicating ancestry or a commit range.
   */
  export type LogRevisionRange =
    | `${string} ${string}`
    | `${string} ^${string}`
    | `${string}...${string}`;
}

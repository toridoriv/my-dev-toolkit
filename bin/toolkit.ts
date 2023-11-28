import "https://deno.land/std@0.208.0/dotenv/load.ts";

import { CommandOptions } from "@tools/command.ts";
import { getFromEnvironment } from "@tools/environment.ts";
import { getAllModuleImports, getLocalPaths } from "@tools/filesystem.ts";
import { Logger, LoggerConfig } from "@tools/logger.ts";
import { tryCatch } from "@tools/try-catch.ts";
import { Command, EnumType } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const { env, logger } = getSetup();
const ENV_PREFIX = "TOOLKIT_" as const;

Object.assign(globalThis, { logger });

/**
 * CLI command to run toolkit commands.
 */
export const run = new Command()
  .name("run")
  .description("Toolkit command runner.")
  .version("0.1.0")
  .globalType("version", new EnumType(["major", "minor", "patch"]))
  .env("TOOLKIT_BIN_DIR=<path:string>", "The scripts directory of your project", {
    prefix: ENV_PREFIX,
    required: false,
    global: true,
  })
  .globalType("severity", new EnumType(LoggerConfig.SeverityName))
  .env(
    "TOOLKIT_LOGGER_LEVEL=<level:severity>",
    "Logger level to use while running commands.",
    {
      prefix: ENV_PREFIX,
      required: false,
      global: true,
    },
  )
  .env("TOOLKIT_PROJECT_ID=<id:string>", "The id of your project in Deno Deploy.", {
    prefix: ENV_PREFIX,
    required: false,
    global: true,
  })
  .env(
    "TOOLKIT_DEPLOY_EXCLUSIONS=<paths:string>",
    "A list of comma separated paths to exclude from a deploy.",
    { prefix: ENV_PREFIX, required: true, global: true },
  )
  .env("DENO_DEPLOY_TOKEN=<token:string>", "The API token to use in Deno Deploy.", {
    prefix: "DENO_",
    required: true,
    global: true,
  })
  .env("TOOLKIT_IMPORT_MAP_PATH=<path:file>", "The project's import map, if any.", {
    prefix: ENV_PREFIX,
    required: false,
    global: true,
  })
  .env("GITHUB_OUTPUT=<path:file>", "GitHub file that stores workflow outputs.", {
    required: false,
    global: true,
  })
  .option("-n, --dry-run", "Dry run the process of a given command.", {
    default: false,
    global: true,
  })
  .action(function () {
    this.showHelp();
  });

const localPaths = tryCatch(getLocalPaths.bind(null, env.BIN_DIR, { skip: [/^_/] }), []);
const defaultPaths = ["init-deno.ts"].map(
  (p) => "https://cdn.jsdelivr.net/gh/toridoriv/my-dev-toolkit@main/bin/" + p,
);

const subcommands = (
  await Promise.all(localPaths.concat(...defaultPaths).map(getAllModuleImports))
)
  .flat()
  .filter(isCommandOptions)
  .map(toCliffy);

registerSubcommands(run, subcommands);

if (import.meta.main) {
  run.parse(Deno.args);
}

function stringifyFlag(flag: CommandOptions.Flag) {
  if (flag.type === "boolean" && flag.abbreviation) {
    return `-${flag.abbreviation}, --${flag.name}`;
  }

  if (flag.type === "boolean") {
    return `--${flag.name}`;
  }

  if (flag.abbreviation) {
    return `-${flag.abbreviation}, --${flag.name} <${flag.name}:${flag.type}>`;
  }

  return `--${flag.name} <${flag.name}:${flag.type}>`;
}

function isCommandOptions(
  value: unknown,
): value is CommandOptions<CommandOptions.Flags, CommandOptions.Arguments> {
  if (typeof value !== "object" || value === null) return false;

  if (!("name" in value) || !("description" in value)) return false;

  return true;
}

function toCliffy(
  options: CommandOptions<CommandOptions.Flags, CommandOptions.Arguments>,
) {
  const command = new Command().name(options.name).description(options.description);

  if (options.flags) {
    for (const k in options.flags) {
      const flag = options.flags[k];
      const strFlags = stringifyFlag(flag);

      command.option(strFlags, flag.description, flag.options);
    }
  }

  if (options.arguments) {
    options.arguments.forEach((arg) => {
      command.arguments(`<${arg.name}:${arg.type}>`);
    });
  }

  // @ts-ignore: ¯\_(ツ)_/¯
  command.action(options.action);

  return command;
}

function registerSubcommands(
  // deno-lint-ignore no-explicit-any
  command: Command<any, any, any>,
  subcommands: Command[],
) {
  subcommands.forEach((subcommand) => {
    command.command(subcommand.getName(), subcommand);
  });
}

function getSetup() {
  const env = {
    BIN_DIR: getFromEnvironment(
      "TOOLKIT_BIN_DIR",
      z.string().min(1).default("./bin").catch("./bin"),
    ),
    LOG_SEVERITY: getFromEnvironment(
      "TOOLKIT_LOGGER_LEVEL",
      LoggerConfig.SeverityNameSchema.default(
        LoggerConfig.SeverityName.Informational,
      ).catch(LoggerConfig.SeverityName.Informational),
    ),
  };

  const logger = new Logger({
    application: "run",
    severity: env.LOG_SEVERITY,
    environment: "",
    mode: LoggerConfig.Mode.Pretty,
  });

  return { logger, env };
}

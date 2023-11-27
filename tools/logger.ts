// deno-lint-ignore-file no-namespace
import type { SafeAny } from "https://cdn.jsdelivr.net/gh/toridoriv/my-dev-toolkit/tools/typings.ts";
import { deepMerge } from "https://deno.land/std@0.208.0/collections/deep_merge.ts";
import { format } from "https://deno.land/std@0.208.0/datetime/format.ts";
import {
  isErrorStatus,
  isInformationalStatus,
  isRedirectStatus,
  isSuccessfulStatus,
} from "https://deno.land/std@0.208.0/http/status.ts";
import z from "https://deno.land/x/zod@v3.22.4/index.ts";
import ansicolors from "https://esm.sh/ansi-colors@4.1.3";

export namespace LoggerConfig {
  export const SeverityName = {
    Silent: "SILENT",
    Debug: "DEBUG",
    Informational: "INFORMATIONAL",
    Warning: "WARNING",
    Error: "ERROR",
  } as const;

  export const SeverityNameSchema = z.nativeEnum(SeverityName);

  export type SeverityName = z.output<typeof SeverityNameSchema>;

  export const SeverityLevel = {
    [SeverityName.Silent]: 0,
    [SeverityName.Debug]: 1,
    [SeverityName.Informational]: 2,
    [SeverityName.Warning]: 3,
    [SeverityName.Error]: 4,
  } as const;

  export const SeverityLevelSchema = z.nativeEnum(SeverityLevel);

  export type SeverityLevel = z.output<typeof SeverityLevelSchema>;

  export const SeverityNameByLevel = {
    [SeverityLevel[SeverityName.Silent]]: SeverityName.Silent,
    [SeverityLevel[SeverityName.Debug]]: SeverityName.Debug,
    [SeverityLevel[SeverityName.Informational]]: SeverityName.Informational,
    [SeverityLevel[SeverityName.Warning]]: SeverityName.Warning,
    [SeverityLevel[SeverityName.Error]]: SeverityName.Error,
  } as const;

  export const LevelName = {
    Error: "ERROR",
    Warn: "WARN",
    Info: "INFO",
    Http: "HTTP",
    Debug: "DEBUG",
  } as const;

  export const LevelNameSchema = z.nativeEnum(LevelName);

  export type LevelName = z.output<typeof LevelNameSchema>;

  export const Mode = {
    Pretty: "PRETTY",
    Json: "JSON",
  } as const;

  export const ModeSchema = z.nativeEnum(Mode);

  export type Mode = z.output<typeof ModeSchema>;

  export const TransportSchema = z.function().returns(z.void());

  export const TransportsSchema = z.object({
    [SeverityName.Silent]: TransportSchema,
    [SeverityName.Debug]: TransportSchema,
    [SeverityName.Informational]: TransportSchema,
    [SeverityName.Warning]: TransportSchema,
    [SeverityName.Error]: TransportSchema,
  });

  export const TransportDefaults = {
    [SeverityName.Silent]: doNothing,
    [SeverityName.Debug]: console.debug,
    [SeverityName.Informational]: console.info,
    [SeverityName.Warning]: console.warn,
    [SeverityName.Error]: console.error,
  };

  function doNothing(..._: SafeAny[]) {
    return;
  }

  const sharedTemplate = `${ansicolors.bold.dim(
    "{@timestamp}",
  )} {log.level} [${ansicolors.bold.white("{log.logger}")}]`;

  const prettyTemplate = `${sharedTemplate} ${ansicolors.dim(
    "{log.origin.file.path}:{log.origin.file.line}:{log.origin.file.column}",
  )} ${ansicolors.yellow("{message}")} {data}`;

  const prettyHttpTemplate = `${sharedTemplate} "${ansicolors.bold.greenBright(
    "{http.request.method} {http.request.url.original}",
  )} ${ansicolors.bold.green.dim(
    "HTTP/{http.version}",
  )}" {http.response.status_code} ${ansicolors.bold.dim("{event.duration}ms")}`;

  const prettyErrorTemplate = `${sharedTemplate} ${ansicolors.dim(
    "{log.origin.file.path}:{log.origin.file.line}:{log.origin.file.column}",
  )} ${ansicolors.yellow("{message}")}\n${ansicolors.bold.bgRed(
    "{error.id}",
  )}: ${ansicolors.bold("{error.message}")} {error.stack_trace}`;

  export const Theme = {
    [LevelName.Error]: ansicolors.bold.red,
    [LevelName.Warn]: ansicolors.bold.yellow,
    [LevelName.Info]: ansicolors.bold.green,
    [LevelName.Http]: ansicolors.bold.cyan,
    [LevelName.Debug]: ansicolors.bold.blue,
  } as const;

  export const HttpStatusTheme = {
    Informational: ansicolors.bold.cyan,
    Successful: ansicolors.bold.cyan,
    Redirection: ansicolors.bold.yellow,
    Error: ansicolors.bold.red,
    Default: ansicolors.bold,
  } as const;

  export const SettingsSchema = z.object({
    severity: SeverityNameSchema,
    application: z.string(),
    environment: z.string(),
    module: z.string().optional(),
    id: z.string().optional(),
    version: z.string().optional(),
    padding: z
      .number()
      .int()
      .default(LevelName.Debug.length + 1),
    mode: ModeSchema,
    transports: TransportsSchema.default(TransportDefaults),
    prettyTemplate: z.string().default(prettyTemplate),
    prettyErrorTemplate: z.string().default(prettyErrorTemplate),
    prettyHttpTemplate: z.string().default(prettyHttpTemplate),
    inspectOptions: z.custom<Deno.InspectOptions>().default({
      colors: true,
    }),
  });

  export type SettingsInput = z.input<typeof SettingsSchema>;

  export type Settings = z.output<typeof SettingsSchema>;
}

namespace LogObject {
  export type Error = {
    code?: string;
    id?: string;
    message?: string;
    name?: string;
    stack?: string;
    title?: string;
  };

  export type Request = {
    httpVersion?: string;
    id?: string;
    method?: string;
    get: (value: string) => string | undefined;
    originalUrl?: string;
  };

  export type Response = {
    duration?: number;
    get: (value: string) => string | undefined;
    statusCode?: number;
  };

  export type OptionalField<T> = T | undefined;
}

class LogObject {
  #error?: LogObject.Error;
  #request?: LogObject.Request;
  #response?: LogObject.Response;

  readonly "@timestamp" = format(new Date(), "yyyy-MM-dd HH:mm:ss.SSS");
  public "log.level": LoggerConfig.LevelName = "" as LoggerConfig.LevelName;
  public "message" = "";
  public "data": LogObject.OptionalField<Array<unknown>> = undefined;
  public "labels": LogObject.OptionalField<Record<string, string>> = undefined;
  public "tags": LogObject.OptionalField<string[]> = undefined;
  public "log.logger" = "unknown";
  public "log.origin.file.column" = 0;
  public "log.origin.file.line" = 0;
  public "log.origin.file.name" = "";
  public "log.origin.file.path" = "";
  public "error.code": LogObject.OptionalField<string> = undefined;
  public "error.id": LogObject.OptionalField<string> = undefined;
  public "error.message": LogObject.OptionalField<string> = undefined;
  public "error.stack_trace": LogObject.OptionalField<string> = undefined;
  public "service.name": LogObject.OptionalField<string> = undefined;
  public "service.version": LogObject.OptionalField<string> = undefined;
  public "service.environment": LogObject.OptionalField<string> = undefined;
  public "service.id": LogObject.OptionalField<string> = undefined;
  readonly "process.args" = Deno.args;
  public "event.duration": LogObject.OptionalField<number> = undefined;
  public "http.version": LogObject.OptionalField<string> = undefined;
  public "http.request.id": LogObject.OptionalField<string> = undefined;
  public "http.request.method": LogObject.OptionalField<string> = undefined;
  public "http.request.mime_type": LogObject.OptionalField<string> = undefined;
  public "http.request.referrer": LogObject.OptionalField<string> = undefined;
  public "http.request.url.original": LogObject.OptionalField<string> = undefined;
  public "http.response.mime_type": LogObject.OptionalField<string> = undefined;
  public "http.response.status_code": LogObject.OptionalField<number> = undefined;

  "constructor"(
    error?: LogObject.Error,
    request?: LogObject.Request,
    response?: LogObject.Response,
  ) {
    this.#error = error!;
    this.#request = request!;
    this.#response = response!;

    if (this.#error) {
      this.setErrorFields(this.#error);
    }

    if (this.#request) {
      this.setRequestFields(this.#request);
    }

    if (this.#response) {
      this.setResponseFields(this.#response);
    }
  }

  public "setBaseFields"(
    message: string,
    data?: Array<unknown>,
    labels?: Record<string, string>,
    tags?: Array<string>,
  ) {
    this.message = message;
    this.data = data;
    this.labels = labels;
    this.tags = tags;

    return this;
  }

  public "setErrorFields"(error: LogObject.Error) {
    if (error instanceof Error) {
      this["error.id"] = error.name;
      this["error.message"] = error.message;
      this["error.stack_trace"] = getStackTrace(error).join(", ");
    } else {
      this["error.code"] = error.code;
      this["error.id"] = error.id;
      this["error.message"] = error.title;
      this["error.message"] = getStackTrace().join("\n");
      this["error.stack_trace"] = getStackTrace().join(", ");
    }

    return this;
  }

  public "setLogFields"(level: LoggerConfig.LevelName, logger: string) {
    const origin = getLastFileStack(
      this.#error instanceof Error ? this.#error : undefined,
    );

    this["log.level"] = level;
    this["log.logger"] = logger;
    this["log.origin.file.column"] = origin.column;
    this["log.origin.file.line"] = origin.line;
    this["log.origin.file.name"] = origin.filename;
    this["log.origin.file.path"] = origin.path;

    return this;
  }

  public "setRequestFields"(request: LogObject.Request) {
    this["http.version"] = request.httpVersion;
    this["http.request.id"] = request.id;
    this["http.request.method"] = request.method;
    this["http.request.mime_type"] = request.get("content-type");
    this["http.request.referrer"] = request.get("referrer");
    this["http.request.url.original"] = request.originalUrl;

    return this;
  }

  public "setResponseFields"(response: LogObject.Response) {
    this["event.duration"] = response.duration || 0.1;
    this["http.response.mime_type"] = response.get("content-type");
    this["http.response.status_code"] = response.statusCode;

    return this;
  }

  public "setServiceFields"(
    environment: string,
    name?: string,
    version?: string,
    id?: string,
  ) {
    this["service.environment"] = environment;
    this["service.name"] = name;
    this["service.version"] = version;
    this["service.id"] = id;

    return this;
  }
}

function getLastFileStack(error = new Error()) {
  const stack = error.stack as string;
  const files = stack.split("\n").filter(isFileLine);

  return getStackDetails(formatStackLine(files[files.length - 1].trim()));
}

function getStackTrace(error = new Error()) {
  const stack = error.stack as string;

  return formatStackTrace(stack);
}

function formatStackTrace(stack: string) {
  return stack.split("\n").filter(isFileLine).map(trim).map(formatStackLine);
}

function isFileLine(line: string) {
  return line.includes("file://") && !line.includes("node_modules/");
}

function trim(value: string) {
  return value.trim();
}

function formatStackLine(line: string) {
  const cwd = `${Deno.cwd()}/`;
  const endIndex = line.indexOf(cwd);

  return line.substring(endIndex).replace(cwd, "").replaceAll(")", "");
}

function getStackDetails(stack: string) {
  const parts = stack.split(":");
  const fileParts = parts[0].split("/");
  const filename = fileParts[fileParts.length - 1];

  return {
    column: Number(parts[2]),
    line: Number(parts[1]),
    filename,
    path: parts[0],
  };
}

type LogOptions = {
  message: string;
  args?: unknown[];
  error?: LogObject.Error;
  request?: LogObject.Request;
  response?: LogObject.Response;
};

abstract class BaseLogger {
  public settings: LoggerConfig.Settings;
  public severityLevel: LoggerConfig.SeverityLevel;

  constructor(settings: LoggerConfig.SettingsInput) {
    this.settings = LoggerConfig.SettingsSchema.parse(settings);
    this.severityLevel = LoggerConfig.SeverityLevel[this.settings.severity];
  }

  protected abstract format(logObject: LogObject): string;

  protected isSilentMode(severity: LoggerConfig.SeverityLevel) {
    if (this.settings.severity === LoggerConfig.SeverityName.Silent) {
      return true;
    }

    return severity < this.severityLevel;
  }

  protected log(
    severity: LoggerConfig.SeverityLevel,
    level: LoggerConfig.LevelName,
    options: LogOptions,
  ) {
    if (this.isSilentMode(severity)) {
      return new LogObject();
    }

    let loggerName = this.settings.application;

    if (this.settings.module) {
      loggerName += `:${this.settings.module}`;
    }

    const logObject = new LogObject(options.error, options.request, options.response)
      .setBaseFields(options.message, options.args)
      .setLogFields(level, loggerName)
      .setServiceFields(
        this.settings.environment,
        this.settings.application,
        this.settings.version,
        this.settings.id,
      );

    const formatted = this.format(logObject);
    const transport =
      this.settings.transports[LoggerConfig.SeverityNameByLevel[severity]];

    transport(formatted);

    return logObject;
  }

  public debug(message: string, ...args: unknown[]) {
    return this.log(LoggerConfig.SeverityLevel.DEBUG, LoggerConfig.LevelName.Debug, {
      message,
      args,
    });
  }

  public info(message: string, ...args: unknown[]) {
    return this.log(
      LoggerConfig.SeverityLevel.INFORMATIONAL,
      LoggerConfig.LevelName.Info,
      {
        message,
        args,
      },
    );
  }

  public http(request: LogObject.Request, response: LogObject.Response) {
    return this.log(
      LoggerConfig.SeverityLevel.INFORMATIONAL,
      LoggerConfig.LevelName.Http,
      {
        request,
        response,
        message: "",
      },
    );
  }

  public warn(message: string, ...args: unknown[]) {
    return this.log(LoggerConfig.SeverityLevel.WARNING, LoggerConfig.LevelName.Warn, {
      message,
      args,
    });
  }

  public error(message: string, ...args: unknown[]) {
    const [error] = args;

    return this.log(LoggerConfig.SeverityLevel.ERROR, LoggerConfig.LevelName.Error, {
      message,
      args,
      error: error as LogObject.Error,
    });
  }

  public getSubLogger(settings: Partial<LoggerConfig.SettingsInput>) {
    const newSettings = deepMerge(this.settings, settings);

    // @ts-ignore: ¯\_(ツ)_/¯
    return new this.constructor(newSettings) as typeof this;
  }
}

class PrettyLogger extends BaseLogger {
  protected inspect(data: unknown) {
    return Deno.inspect(data, this.settings.inspectOptions);
  }

  protected prettifyStack(value: string) {
    return ansicolors.yellow(`  • ${ansicolors.underline(value)}`);
  }

  protected substitute(value: string, substitutions: Record<string, SafeAny>): string {
    const regex = /{(.+?)\}/g;

    return value.replace(regex, (match: string, _index: number) => {
      const key = match.replace("{", "").replace("}", "");
      const substitution = substitutions[key];

      return substitution ? substitution : match;
    });
  }

  protected applyTemplate(template: string, log: LogObject) {
    const args = log.data ? log.data.map(this.inspect.bind(this)).join("\n") : "";
    const stack = log["error.stack_trace"]
      ? log["error.stack_trace"].split(", ").map(this.prettifyStack).join("\n")
      : "";

    if (args) {
      template = template.replaceAll("{data}", `\n${args}`);
    }

    if (stack) {
      template = template.replaceAll("{error.stack_trace}", `\n${stack}`);
    }

    return this.substitute(template, log);
  }

  protected getStatusColor(status: number) {
    if (isErrorStatus(status)) {
      return LoggerConfig.HttpStatusTheme.Error;
    }

    if (isSuccessfulStatus(status)) {
      return LoggerConfig.HttpStatusTheme.Successful;
    }

    if (isInformationalStatus(status)) {
      return LoggerConfig.HttpStatusTheme.Informational;
    }

    if (isRedirectStatus(status)) {
      return LoggerConfig.HttpStatusTheme.Redirection;
    }

    return LoggerConfig.HttpStatusTheme.Default;
  }

  protected getPrettyTemplate(level: LoggerConfig.LevelName, status?: number) {
    const spaces = " ".repeat(this.settings.padding - level.length);
    let template =
      level === "HTTP"
        ? this.settings.prettyHttpTemplate
        : level === "ERROR"
        ? this.settings.prettyErrorTemplate
        : this.settings.prettyTemplate;

    if (status) {
      template = template.replaceAll(
        "{http.response.status_code}",
        this.getStatusColor(status)("{http.response.status_code}"),
      );
    }

    return template.replaceAll(
      "{log.level}",
      LoggerConfig.Theme[level](`{log.level}${spaces}`),
    );
  }

  protected format(logObject: LogObject) {
    return this.applyTemplate(
      this.getPrettyTemplate(
        logObject["log.level"],
        logObject["http.response.status_code"],
      ),
      logObject,
    );
  }
}

class JsonLogger extends BaseLogger {
  protected format(logObject: LogObject) {
    return JSON.stringify(logObject, null, 2);
  }
}

// @ts-ignore: ¯\_(ツ)_/¯
export class Logger extends BaseLogger {
  constructor(settings: LoggerConfig.SettingsInput) {
    super(settings);

    const parent =
      this.settings.mode === LoggerConfig.Mode.Pretty ? PrettyLogger : JsonLogger;
    Object.setPrototypeOf(this, parent.prototype);
  }
}
import { CallSite, SafeAny } from "./typings.mjs";

export {};

declare global {
  interface ErrorConstructor {
    // @ts-ignore: ¯\_(ツ)_/¯
    prepareStackTrace: (error: Error, callsites: CallSite[]) => SafeAny;
  }
}

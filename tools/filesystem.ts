import {
  WalkEntry,
  WalkOptions,
  walkSync,
} from "https://deno.land/std@0.208.0/fs/walk.ts";
import { resolve } from "https://deno.land/std@0.208.0/path/mod.ts";

/**
 * Gets local file system paths recursively for a given directory.
 *
 * @param directory - The root directory path to traverse.
 * @param options - Options to pass to walkSync.
 * @returns Array of discovered file system paths.
 */
export function getLocalPaths(directory: string, options?: WalkOptions) {
  const iterator = walkSync(directory, options);

  return Array.from(iterator, getPath.bind(null, directory));
}

/**
 * Imports a module from the given file path and returns all exported values.
 *
 * This dynamically imports the module at the provided path using `import()`,
 * then returns an array containing all the exported values from that module.
 *
 * @param path - The file path of the module to import.
 * @returns Array of exported values from the imported module.
 */
export async function getAllModuleImports(path: string) {
  const mod = await import(path);

  return Object.values(mod);
}

function getPath(directory: string, entry: WalkEntry) {
  return resolve(directory, entry.path);
}

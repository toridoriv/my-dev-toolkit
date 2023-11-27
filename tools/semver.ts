export type { SemVer } from "https://deno.land/std@0.208.0/semver/mod.ts";
import {
  format,
  increment,
  parse,
  type SemVer,
} from "https://deno.land/std@0.208.0/semver/mod.ts";
import { sort } from "https://deno.land/std@0.208.0/semver/sort.ts";

const NEXT_VERSION_METHOD_BY_RELEASE_TYPE = {
  patch: "getNextPatch",
  minor: "getNextMinor",
  major: "getNextMajor",
} as const;

const VALID_RELEASE_TYPE = ["major", "minor", "patch"];

/** The type of release to perform when generating the next version. */
export type ReleaseType = keyof typeof NEXT_VERSION_METHOD_BY_RELEASE_TYPE;

/**
 * Represents a version object that encapsulates a semantic version and provides methods
 * to obtain the next version based on different release types.
 *
 * @example
 *
 * ```ts
 * import { VersionObject } from "./versioning.ts";
 *
 * const fromString = new VersionObject("1.2.3");
 *
 * console.assert(fromString.tag === "v1.2.3");
 * console.assert(fromString.semver.major === 1);
 * console.assert(fromString.semver.minor === 2);
 * console.assert(fromString.semver.patch === 3);
 *
 * const fromSemver = new VersionObject({
 *   major: 1,
 *   minor: 2,
 *   patch: 3,
 *   prerelease: [],
 *   build: [],
 * });
 *
 * console.assert(fromSemver.version === "1.2.3");
 * console.assert(fromSemver.tag === "v1.2.3");
 * ```
 */
export class VersionObject {
  /**
   * Get the method name to retrieve the next version based on the specified release type.
   *
   * @param type - The type of release (major, minor, or patch).
   * @returns The name of the method for obtaining the next version.
   */
  static getMethodNameByReleaseType(type: ReleaseType) {
    return NEXT_VERSION_METHOD_BY_RELEASE_TYPE[type];
  }

  readonly version: string;
  readonly tag: string;
  readonly semver: SemVer;

  constructor(rawVersion: string | SemVer) {
    if (typeof rawVersion === "string") {
      this.version = rawVersion;
      this.semver = parse(rawVersion);
    } else {
      this.semver = rawVersion;
      this.version = format(this.semver);
    }

    this.tag = `v${this.version}`;
  }

  /**
   * Get the next version by the specified release type.
   *
   * @param type - The type of release (major, minor, or patch).
   * @param prerelease - The "prerelease identifier" to use as a prefix for the "prerelease" part of a semver. Like the rc in `1.2.0-rc.8`.
   * @returns A new `VersionObject` instance representing the next version.
   */
  getNextVersion(type: ReleaseType, prelease?: string) {
    return this[VersionObject.getMethodNameByReleaseType(type)](prelease);
  }

  /**
   * Get the next patch version.
   *
   * @param prerelease - The "prerelease identifier" to use as a prefix for the "prerelease" part of a semver. Like the rc in `1.2.0-rc.8`.
   * @returns A new VersionObject instance representing the next patch version.
   *
   * @example
   *
   * ```ts
   * import { VersionObject } from "./versioning.ts";
   *
   * const currentVersion = new VersionObject("1.2.3");
   * const nextPatchVersion = currentVersion.getNextPatch();
   *
   * console.assert(nextPatchVersion.version === "1.2.4");
   * console.assert(nextPatchVersion.tag === "v1.2.4");
   * ```
   */
  getNextPatch(prelease?: string) {
    const release = prelease ? "prepatch" : "patch";
    return new VersionObject(increment(this.semver, release, prelease));
  }

  /**
   * Get the next minor version.
   *
   * @param prerelease - The "prerelease identifier" to use as a prefix for the "prerelease" part of a semver. Like the rc in `1.2.0-rc.8`.
   * @returns A new VersionObject instance representing the next minor version.
   *
   * @example
   *
   * ```ts
   * import { VersionObject } from "./versioning.ts";
   *
   * const currentVersion = new VersionObject("1.2.3");
   * const nextMinorVersion = currentVersion.getNextMinor();
   *
   * console.assert(nextMinorVersion.version === "1.3.0");
   * console.assert(nextMinorVersion.tag === "v1.3.0");
   * ```
   */
  getNextMinor(prelease?: string) {
    const release = prelease ? "preminor" : "minor";
    return new VersionObject(increment(this.semver, release, prelease));
  }

  /**
   * Get the next major version.
   *
   * @param prerelease - The "prerelease identifier" to use as a prefix for the "prerelease" part of a semver. Like the rc in `1.2.0-rc.8`.
   * @returns A new VersionObject instance representing the next major version.
   *
   * @example
   *
   * ```ts
   * import { VersionObject } from "./versioning.ts";
   *
   * const currentVersion = new VersionObject("1.2.3");
   * const nextMajorVersion = currentVersion.getNextMajor();
   *
   * console.assert(nextMajorVersion.version === "2.0.0");
   * console.assert(nextMajorVersion.tag === "v2.0.0");
   * ```
   */
  getNextMajor(prelease?: string) {
    const release = prelease ? "premajor" : "major";
    return new VersionObject(increment(this.semver, release, prelease));
  }
}

/**
 * Gets the current version number from the project configuration.
 *
 * @returns A VersionObject instance representing the current version.
 *
 * @example
 *
 * ```ts
 * import { getCurrentVersion } from "./versioning.ts";
 *
 * const currentVersion = getCurrentVersion("1.2.3");
 *
 * console.assert(currentVersion.version === "1.2.3");
 * console.assert(currentVersion.tag === "v1.2.3");
 * ```
 */
export function getCurrentVersion(version: string) {
  return new VersionObject(version);
}

/**
 * Checks if the given string is a valid release type.
 * @see {@link ReleaseType}
 *
 * @param value - The string to check.
 * @returns `true` if the value is a valid release type, `false` otherwise.
 */
export function isValidReleaseType(value: string): value is ReleaseType {
  return VALID_RELEASE_TYPE.includes(value);
}

/**
 * Sorts an array of semantic version strings into ascending order.
 *
 * @param versions - The array of version strings to sort.
 * @returns The sorted array of version strings.
 */
export function sortVersions(...versions: string[]) {
  return sort(versions.map(parse)).map((v) => `v${format(v)}`);
}

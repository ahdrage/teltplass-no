/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cities from "../cities.js";
import type * as imageMigration from "../imageMigration.js";
import type * as newsletter from "../newsletter.js";
import type * as places from "../places.js";
import type * as seed from "../seed.js";
import type * as storage from "../storage.js";
import type * as submissions from "../submissions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cities: typeof cities;
  imageMigration: typeof imageMigration;
  newsletter: typeof newsletter;
  places: typeof places;
  seed: typeof seed;
  storage: typeof storage;
  submissions: typeof submissions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

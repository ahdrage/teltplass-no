/**
 * Fathom custom event names (dashboard-friendly, no special characters).
 * @see https://usefathom.com/docs/features/events
 */
export const FATHOM_EVENTS = {
  SUBMIT_NEW_PLACE: "submit new place",
  SEARCH_PLACES: "search places",
  BROWSE_CITY: "browse city",
  OPEN_PLACE_FROM_CITY: "open place from city",
  OPEN_PLACE_FROM_HOME: "open place from home",
  OPEN_PLACE_FROM_SEARCH: "open place from search",
  OPEN_PLACE_FROM_NEARBY: "open place from nearby",
  NEWSLETTER_SIGNUP: "newsletter signup",
  TOGGLE_MAP_FILTER: "toggle map filter",
} as const;

export type PlaceLinkSource = "home" | "city" | "search" | "nearby";

export function placeLinkEventForSource(
  source: PlaceLinkSource | undefined,
): string | null {
  switch (source) {
    case "home":
      return FATHOM_EVENTS.OPEN_PLACE_FROM_HOME;
    case "city":
      return FATHOM_EVENTS.OPEN_PLACE_FROM_CITY;
    case "search":
      return FATHOM_EVENTS.OPEN_PLACE_FROM_SEARCH;
    case "nearby":
      return FATHOM_EVENTS.OPEN_PLACE_FROM_NEARBY;
    default:
      return null;
  }
}

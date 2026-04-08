export interface RawPlaceImageSource {
  approved?: string;
  title?: string;
  "photo gallery"?: string;
  "photo main"?: string;
  "unique id"?: string;
}

export interface RawCityImageSource {
  Slug?: string;
  image?: string;
}

export interface PlaceImageSource {
  photoMain?: string;
  photos: string[];
}

export function normalizeImageUrl(url: string | undefined): string | undefined {
  const trimmedUrl = url?.trim();
  if (!trimmedUrl) {
    return undefined;
  }

  if (trimmedUrl.startsWith("//")) {
    return `https:${trimmedUrl}`;
  }

  return trimmedUrl;
}

export function buildCityImageSourceBySlug(
  cities: readonly RawCityImageSource[],
): Map<string, string> {
  const imageBySlug = new Map<string, string>();

  for (const city of cities) {
    const slug = city.Slug?.trim();
    const imageUrl = normalizeImageUrl(city.image);
    if (!slug || !imageUrl) {
      continue;
    }

    imageBySlug.set(slug, imageUrl);
  }

  return imageBySlug;
}

export function buildPlaceImageSourceByOldPath(
  places: readonly RawPlaceImageSource[],
): Map<string, PlaceImageSource> {
  const imageSourceByOldPath = new Map<string, PlaceImageSource>();

  for (const place of places) {
    if (place.approved !== "ja") {
      continue;
    }

    const oldPath = buildLegacyPlaceOldPath(place);
    if (!oldPath) {
      continue;
    }

    const photoMain = normalizeImageUrl(place["photo main"]);
    const photos = dedupeStrings([
      photoMain,
      ...parseCommaSeparatedUrls(place["photo gallery"]),
    ]);

    imageSourceByOldPath.set(oldPath, {
      photoMain,
      photos,
    });
  }

  return imageSourceByOldPath;
}

function buildLegacyPlaceOldPath(place: RawPlaceImageSource): string | null {
  const title = place.title?.trim();
  const uniqueId = place["unique id"]?.trim();
  if (!title || !uniqueId) {
    return null;
  }

  return `/c/${title.toLowerCase().replace(/\s+/g, "-")}-${uniqueId}`;
}

function parseCommaSeparatedUrls(value: string | undefined): string[] {
  return (value || "")
    .split(",")
    .map((item) => normalizeImageUrl(item))
    .filter((item): item is string => Boolean(item));
}

function dedupeStrings(values: readonly (string | undefined)[]): string[] {
  const uniqueValues = new Set<string>();
  for (const value of values) {
    if (!value) {
      continue;
    }
    uniqueValues.add(value);
  }
  return Array.from(uniqueValues);
}

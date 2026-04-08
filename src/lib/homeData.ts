export interface CityRecord {
  _id: string;
  _creationTime?: number;
  name: string;
  slug: string;
  placeCount: number;
  image?: unknown;
}

export interface PlaceRecord {
  _id: string;
  _creationTime?: number;
  slug: string;
  createdAt?: number;
  photos: readonly unknown[];
  photoMain?: unknown;
}

function compareCityRecords<T extends CityRecord>(a: T, b: T): number {
  if (a.placeCount !== b.placeCount) {
    return b.placeCount - a.placeCount;
  }

  const aHasImage = a.image !== undefined;
  const bHasImage = b.image !== undefined;
  if (aHasImage !== bHasImage) {
    return aHasImage ? -1 : 1;
  }

  return (b._creationTime ?? 0) - (a._creationTime ?? 0);
}

export function pickBestCityRecord<T extends CityRecord>(
  cities: readonly T[],
): T | undefined {
  return cities.reduce<T | undefined>((bestCity, city) => {
    if (!bestCity) {
      return city;
    }

    return compareCityRecords(city, bestCity) < 0 ? city : bestCity;
  }, undefined);
}

export function dedupeCities<T extends CityRecord>(cities: readonly T[]): T[] {
  const citiesBySlug = new Map<string, T>();

  for (const city of cities) {
    const existingCity = citiesBySlug.get(city.slug);
    if (!existingCity) {
      citiesBySlug.set(city.slug, city);
      continue;
    }

    const bestCity = pickBestCityRecord([existingCity, city]);
    if (bestCity) {
      citiesBySlug.set(city.slug, bestCity);
    }
  }

  return Array.from(citiesBySlug.values()).sort(compareCityRecords);
}

function comparePlaceRecords<T extends PlaceRecord>(a: T, b: T): number {
  const aPhotoCount = a.photos.length;
  const bPhotoCount = b.photos.length;
  if (aPhotoCount !== bPhotoCount) {
    return bPhotoCount - aPhotoCount;
  }

  const aHasMainPhoto = a.photoMain !== undefined;
  const bHasMainPhoto = b.photoMain !== undefined;
  if (aHasMainPhoto !== bHasMainPhoto) {
    return aHasMainPhoto ? -1 : 1;
  }

  if ((a.createdAt ?? 0) !== (b.createdAt ?? 0)) {
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  }

  return (b._creationTime ?? 0) - (a._creationTime ?? 0);
}

export function pickBestPlaceRecord<T extends PlaceRecord>(
  places: readonly T[],
): T | undefined {
  return places.reduce<T | undefined>((bestPlace, place) => {
    if (!bestPlace) {
      return place;
    }

    return comparePlaceRecords(place, bestPlace) < 0 ? place : bestPlace;
  }, undefined);
}

export function dedupePlaces<T extends PlaceRecord>(places: readonly T[]): T[] {
  const placesBySlug = new Map<string, T>();

  for (const place of places) {
    const existingPlace = placesBySlug.get(place.slug);
    if (!existingPlace) {
      placesBySlug.set(place.slug, place);
      continue;
    }

    const bestPlace = pickBestPlaceRecord([existingPlace, place]);
    if (bestPlace) {
      placesBySlug.set(place.slug, bestPlace);
    }
  }

  return Array.from(placesBySlug.values()).sort(comparePlaceRecords);
}

export function getVisibleItems<T>(
  items: readonly T[],
  initialCount: number,
  isExpanded: boolean,
): T[] {
  if (isExpanded) {
    return [...items];
  }

  return items.slice(0, initialCount);
}

export function collectVisibleStorageIds(
  storageIds: readonly (string | null | undefined)[],
): string[] {
  const uniqueIds = new Set<string>();

  for (const storageId of storageIds) {
    if (!storageId) {
      continue;
    }
    uniqueIds.add(storageId);
  }

  return Array.from(uniqueIds);
}

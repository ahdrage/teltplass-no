import * as fs from "fs";
import * as path from "path";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  const envLocal = fs.readFileSync(
    path.join(__dirname, "..", ".env.local"),
    "utf-8"
  );
  const match = envLocal.match(/NEXT_PUBLIC_CONVEX_URL=(.+)/);
  if (match) {
    process.env.NEXT_PUBLIC_CONVEX_URL = match[1].trim();
  }
}

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

interface RawPlaceNew {
  addresse: string;
  approved: string;
  description: string;
  lat: string;
  "OS Amenities": string;
  "photo gallery": string;
  "photo main": string;
  title: string;
  "Creation Date": string;
  "unique id": string;
}

interface RawPlaceOld {
  addresse: string;
  long: string;
}

interface RawCity {
  adresse: string;
  image: string;
  "place name": string;
  Slug: string;
}

function parseCoord(val: string): number {
  return parseFloat(val.replace(",", "."));
}

function makeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseAmenities(raw: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a.length > 0);
}

function parsePhotos(raw: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0)
    .map((url) => (url.startsWith("//") ? `https:${url}` : url));
}

function titleFromAddress(address: string): string {
  const parts = address.split(",");
  const first = parts[0].trim();
  if (/^[A-Z0-9+]+\s/.test(first) && parts.length > 1) {
    return parts[1].trim().split(",")[0];
  }
  return first;
}

function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function uploadImage(
  client: ConvexHttpClient,
  url: string
): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size < 100) return null;

    const uploadUrl: string = await client.mutation(
      api.seed.generateUploadUrl,
      {}
    );
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": blob.type || "image/jpeg" },
      body: blob,
    });
    if (!uploadRes.ok) return null;
    const { storageId } = (await uploadRes.json()) as { storageId: string };
    return storageId;
  } catch (e) {
    console.error(`  Failed to upload ${url}: ${e}`);
    return null;
  }
}

const CITY_COORDS: Record<string, [number, number]> = {
  kristiansand: [58.1599, 8.0182],
  oslo: [59.9139, 10.7522],
  hvaler: [59.0833, 10.9833],
  "østmarka": [59.87, 10.91],
  trondheim: [63.4305, 10.3951],
  "østfold": [59.37, 11.1],
  nordmarka: [59.98, 10.65],
  fredrikstad: [59.2181, 10.9298],
  oslofjorden: [59.7, 10.6],
  lofoten: [68.2, 14.4],
  bergen: [60.3913, 5.3221],
  vestfold: [59.25, 10.25],
  rogaland: [58.85, 6.0],
  geiranger: [62.1008, 7.2058],
  "tromsø": [69.6496, 18.9553],
  "svolvær": [68.2342, 14.5684],
  stavanger: [58.97, 5.7331],
  "ålesund": [62.4722, 6.1495],
  senja: [69.3, 17.0],
  "bodø": [67.2804, 14.4049],
  saltstraumen: [67.23, 14.6],
  hamar: [60.7945, 11.0679],
  otta: [61.773, 9.537],
  sandefjord: [59.1314, 10.2166],
  "henningsvær": [68.1522, 14.2008],
  hardangervidda: [60.1, 7.5],
  stavern: [59.0, 10.03],
  rondane: [61.85, 9.8],
  "gjøvik": [60.796, 10.691],
  besseggen: [61.5, 8.8],
  "bærum": [59.89, 10.53],
  asker: [59.83, 10.44],
};

function getCityCoords(
  cityName: string,
  slug: string
): [number, number] {
  const nameLower = cityName.toLowerCase();
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (nameLower.includes(key) || key.includes(nameLower)) return coords;
  }
  const slugNormalized = slug
    .replace(/oe/g, "ø")
    .replace(/ae/g, "æ")
    .replace(/aa/g, "å");
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (key === slugNormalized || slugNormalized.includes(key)) return coords;
  }
  return [59.9139, 10.7522];
}

async function main() {
  const envLocal = fs.readFileSync(
    path.join(__dirname, "..", ".env.local"),
    "utf-8"
  );
  const match = envLocal.match(/NEXT_PUBLIC_CONVEX_URL=(.+)/);
  const convexUrl = match?.[1]?.trim();
  if (!convexUrl) {
    console.error("Could not find NEXT_PUBLIC_CONVEX_URL in .env.local");
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);

  const placesNew: RawPlaceNew[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "data", "places_new.json"), "utf-8")
  );
  const placesOld: RawPlaceOld[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "data", "places_old.json"), "utf-8")
  );
  const citiesRaw: RawCity[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "data", "cities.json"), "utf-8")
  );

  const oldByAddr = new Map<string, RawPlaceOld>();
  for (const o of placesOld) oldByAddr.set(o.addresse, o);

  const approved = placesNew.filter(
    (d) =>
      d.approved === "ja" &&
      !d.addresse.startsWith("(error") &&
      parseCoord(d.lat) !== 0
  );

  console.log(`\n=== SEEDING ${approved.length} PLACES ===\n`);

  const slugCounts = new Map<string, number>();
  const importedPlaces: Array<{ lat: number; lng: number }> = [];

  for (let i = 0; i < approved.length; i++) {
    const place = approved[i];
    const old = oldByAddr.get(place.addresse);
    const lng = old ? parseCoord(old.long) : 0;
    const lat = parseCoord(place.lat);

    if (lat === 0 || lng === 0) {
      console.log(`  Skipping ${place.addresse} - invalid coords`);
      continue;
    }

    const title = place.title?.trim() || titleFromAddress(place.addresse);
    let slug = makeSlug(title);
    const count = slugCounts.get(slug) || 0;
    if (count > 0) slug = `${slug}-${count + 1}`;
    slugCounts.set(slug, count + 1);

    const oldPath =
      place.title?.trim() && place["unique id"]
        ? `/c/${place.title.trim().toLowerCase().replace(/\s+/g, "-")}-${place["unique id"]}`
        : undefined;

    const photoUrls = parsePhotos(place["photo gallery"]);
    const photoIds: string[] = [];

    for (const url of photoUrls) {
      const storageId = await uploadImage(client, url);
      if (storageId) photoIds.push(storageId);
    }

    let photoMain: string | undefined;
    if (photoIds.length > 0) {
      photoMain = photoIds[0];
    }

    const createdAt = place["Creation Date"]
      ? new Date(place["Creation Date"]).getTime()
      : Date.now();

    await client.mutation(api.seed.insertPlace, {
      title,
      slug,
      description: place.description?.trim() || "",
      address: place.addresse,
      lat,
      lng,
      amenities: parseAmenities(place["OS Amenities"]),
      photos: photoIds as any,
      photoMain: photoMain as any,
      approved: true,
      oldPath,
      createdAt,
    });

    importedPlaces.push({ lat, lng });
    console.log(`  [${i + 1}/${approved.length}] ${title} (${slug})`);
  }

  console.log(`\n=== SEEDING ${citiesRaw.length} CITIES ===\n`);

  for (const city of citiesRaw) {
    const name = city["place name"];
    const slug = city.Slug;
    const [lat, lng] = getCityCoords(name, slug);

    let imageId: string | undefined;
    if (city.image?.trim()) {
      const url = city.image.startsWith("//")
        ? `https:${city.image}`
        : city.image;
      imageId = (await uploadImage(client, url)) || undefined;
    }

    const placeCount = importedPlaces.filter(
      (p) => haversine(lat, lng, p.lat, p.lng) <= 30
    ).length;

    await client.mutation(api.seed.insertCity, {
      name,
      slug,
      lat,
      lng,
      image: imageId as any,
      placeCount,
    });

    console.log(`  ${name} (${slug}) - ${placeCount} places within 30km`);
  }

  console.log("\n=== SEED COMPLETE ===\n");
}

main().catch(console.error);

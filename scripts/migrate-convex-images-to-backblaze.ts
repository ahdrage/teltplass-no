import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { ConvexHttpClient } from "convex/browser";
import sharp from "sharp";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { uploadBufferToBackblaze } from "../src/lib/backblaze.server";
import {
  buildCityImageSourceBySlug,
  buildPlaceImageSourceByOldPath,
  type RawCityImageSource,
  type RawPlaceImageSource,
} from "../src/lib/imageSourceData";

loadEnvLocal();

interface PlaceRecord {
  _id: string;
  oldPath?: string;
  photoMain?: string;
  photos: string[];
  slug: string;
  title: string;
}

interface CityRecord {
  _id: string;
  image?: string;
  slug: string;
}

interface SubmissionRecord {
  _id: string;
  photos: string[];
  status: string;
  title: string;
}

interface MigratedImageSet {
  oldStorageIds: string[];
  photoMain?: string;
  photos: string[];
}

const uploadedUrlCache = new Map<string, string>();
const execFileAsync = promisify(execFile);

void (async function main(): Promise<void> {
  const convexUrl = process.env.CONVEX_MIGRATION_URL;
  if (!convexUrl) {
    throw new Error("Missing CONVEX_MIGRATION_URL");
  }

  const client = new ConvexHttpClient(convexUrl);
  const deleteConvexFiles = process.env.DELETE_CONVEX_FILES === "1";

  const placeImageSources = buildPlaceImageSourceByOldPath(
    readJsonFile<RawPlaceImageSource[]>("data/places_new.json"),
  );
  const cityImageSources = buildCityImageSourceBySlug(
    readJsonFile<RawCityImageSource[]>("data/cities.json"),
  );

  const places = (await client.query(api.imageMigration.listAllPlaces, {})) as PlaceRecord[];
  const cities = (await client.query(api.imageMigration.listAllCities, {})) as CityRecord[];
  const submissions = (await client.query(
    api.imageMigration.listAllSubmissions,
    {},
  )) as SubmissionRecord[];

  console.log(`Migrating ${places.length} places`);
  for (const place of places) {
    if (hasOnlyBackblazeUrls(place.photos, place.photoMain)) {
      console.log(`  Skipped place ${place.slug} (already on Backblaze)`);
      continue;
    }

    const sourceImages =
      (place.oldPath ? placeImageSources.get(place.oldPath) : undefined) ?? null;
    const migratedImages = sourceImages
      ? await migrateExternalImageSet({
          entityId: place.slug || place._id,
          folder: "places",
          photoMain: sourceImages.photoMain,
          photos: sourceImages.photos,
        })
      : await migrateExistingImageSet({
          client,
          entityId: place.slug || place._id,
          folder: "places",
          imageValues: place.photos,
          preferredMainImage: place.photoMain,
        });

    await client.mutation(api.imageMigration.updatePlaceImages, {
      id: place._id as Id<"places">,
      photoMain: migratedImages.photoMain,
      photos: migratedImages.photos,
    });
    if (deleteConvexFiles) {
      await deleteMigratedConvexFiles(client, migratedImages.oldStorageIds);
    }
    console.log(`  Migrated place ${place.slug}`);
  }

  console.log(`Migrating ${cities.length} cities`);
  for (const city of cities) {
    if (city.image && isBackblazeUrl(city.image)) {
      console.log(`  Skipped city ${city.slug} (already on Backblaze)`);
      continue;
    }

    const sourceImage = cityImageSources.get(city.slug);
    const migratedImage = sourceImage
      ? {
          oldStorageIds: [],
          url: await uploadExternalImageToBackblaze({
            entityId: city.slug || city._id,
            fileName: `${city.slug || city._id}-hero`,
            folder: "cities",
            sourceUrl: sourceImage,
          }),
        }
      : await migrateSingleExistingImage({
          client,
          entityId: city.slug || city._id,
          fileName: `${city.slug || city._id}-hero`,
          folder: "cities",
          imageValue: city.image,
        });

    if (!migratedImage.url) {
      continue;
    }

    await client.mutation(api.imageMigration.updateCityImage, {
      id: city._id as Id<"cities">,
      image: migratedImage.url,
    });
    if (deleteConvexFiles) {
      await deleteMigratedConvexFiles(client, migratedImage.oldStorageIds);
    }
    console.log(`  Migrated city ${city.slug}`);
  }

  console.log(`Migrating ${submissions.length} submissions`);
  for (const submission of submissions) {
    if (hasOnlyBackblazeUrls(submission.photos)) {
      console.log(`  Skipped submission ${submission.title} (already on Backblaze)`);
      continue;
    }

    const migratedImages = await migrateExistingImageSet({
      client,
      entityId: submission._id,
      folder: "submissions",
      imageValues: submission.photos,
    });

    await client.mutation(api.imageMigration.updateSubmissionImages, {
      id: submission._id as Id<"submissions">,
      photos: migratedImages.photos,
    });
    if (deleteConvexFiles) {
      await deleteMigratedConvexFiles(client, migratedImages.oldStorageIds);
    }
    console.log(`  Migrated submission ${submission.title}`);
  }

  console.log("Image migration complete.");
})().catch((error: unknown) => {
  console.error("Image migration failed", error);
  process.exit(1);
});

async function migrateExistingImageSet(args: {
  client: ConvexHttpClient;
  entityId: string;
  folder: string;
  imageValues: string[];
  preferredMainImage?: string;
}): Promise<MigratedImageSet> {
  const photos: string[] = [];
  const oldStorageIds: string[] = [];

  for (const [index, imageValue] of args.imageValues.entries()) {
    const migratedImage = await migrateSingleExistingImage({
      client: args.client,
      entityId: args.entityId,
      fileName: `image-${index + 1}`,
      folder: args.folder,
      imageValue,
    });
    if (migratedImage.url) {
      photos.push(migratedImage.url);
    }
    oldStorageIds.push(...migratedImage.oldStorageIds);
  }

  return {
    oldStorageIds,
    photoMain: photos[0],
    photos,
  };
}

async function migrateExternalImageSet(args: {
  entityId: string;
  folder: string;
  photoMain?: string;
  photos: string[];
}): Promise<MigratedImageSet> {
  const migratedPhotos: string[] = [];

  for (const [index, sourceUrl] of args.photos.entries()) {
    const migratedUrl = await uploadExternalImageToBackblaze({
      entityId: args.entityId,
      fileName: `image-${index + 1}`,
      folder: args.folder,
      sourceUrl,
    });
    migratedPhotos.push(migratedUrl);
  }

  const photoMain = args.photoMain
    ? await uploadExternalImageToBackblaze({
        entityId: args.entityId,
        fileName: "image-main",
        folder: args.folder,
        sourceUrl: args.photoMain,
      })
    : migratedPhotos[0];

  return {
    oldStorageIds: [],
    photoMain,
    photos: dedupeStrings(photoMain ? [photoMain, ...migratedPhotos] : migratedPhotos),
  };
}

async function uploadExternalImageToBackblaze(args: {
  entityId: string;
  fileName: string;
  folder: string;
  sourceUrl: string;
}): Promise<string> {
  const cacheKey = `external:${args.sourceUrl}`;
  const cachedUrl = uploadedUrlCache.get(cacheKey);
  if (cachedUrl) {
    return cachedUrl;
  }

  const response = await fetch(args.sourceUrl, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to download ${args.sourceUrl}: ${response.status}`);
  }

  const optimizedImage = await optimizeImageForWeb({
    body: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || undefined,
  });
  const url = await uploadBufferToBackblaze({
    body: optimizedImage.body,
    contentType: optimizedImage.contentType,
    entityId: args.entityId,
    fileName: `${args.fileName}${optimizedImage.extension}`,
    folder: args.folder,
  });
  uploadedUrlCache.set(cacheKey, url);
  return url;
}

async function migrateSingleExistingImage(args: {
  client: ConvexHttpClient;
  entityId: string;
  fileName: string;
  folder: string;
  imageValue?: string;
}): Promise<{ oldStorageIds: string[]; url?: string }> {
  if (!args.imageValue) {
    return {
      oldStorageIds: [],
    };
  }

  if (isBackblazeUrl(args.imageValue)) {
    return {
      oldStorageIds: [],
      url: args.imageValue,
    };
  }

  if (isHttpUrl(args.imageValue)) {
    const url = await uploadExternalImageToBackblaze({
      entityId: args.entityId,
      fileName: args.fileName,
      folder: args.folder,
      sourceUrl: args.imageValue,
    });
    return {
      oldStorageIds: [],
      url,
    };
  }

  const cacheKey = `storage:${args.imageValue}`;
  const cachedUrl = uploadedUrlCache.get(cacheKey);
  if (cachedUrl) {
    return {
      oldStorageIds: [args.imageValue],
      url: cachedUrl,
    };
  }

  const storageUrl = (await args.client.query(api.storage.getUrl, {
    storageId: args.imageValue as Id<"_storage">,
  })) as string | null;
  if (!storageUrl) {
    console.warn(`Skipping missing Convex storage object ${args.imageValue}.`);
    return {
      oldStorageIds: [],
    };
  }

  const response = await fetch(storageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download ${storageUrl}: ${response.status}`);
  }

  const optimizedImage = await optimizeImageForWeb({
    body: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || undefined,
  });
  const url = await uploadBufferToBackblaze({
    body: optimizedImage.body,
    contentType: optimizedImage.contentType,
    entityId: args.entityId,
    fileName: `${args.fileName}${optimizedImage.extension}`,
    folder: args.folder,
  });
  uploadedUrlCache.set(cacheKey, url);

  return {
    oldStorageIds: [args.imageValue],
    url,
  };
}

async function deleteMigratedConvexFiles(
  client: ConvexHttpClient,
  oldStorageIds: string[],
): Promise<void> {
  const uniqueStorageIds = Array.from(new Set(oldStorageIds));
  if (uniqueStorageIds.length === 0) {
    return;
  }

  await client.mutation(api.imageMigration.deleteStorageFiles, {
    storageIds: uniqueStorageIds as Id<"_storage">[],
  });
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//.test(value);
}

function isBackblazeUrl(value: string): boolean {
  return value.includes("backblazeb2.com");
}

async function optimizeImageForWeb(args: {
  body: Buffer;
  contentType?: string;
}): Promise<{ body: Buffer; contentType: string; extension: string }> {
  const contentType = (args.contentType || "").split(";")[0].trim().toLowerCase();
  if (contentType === "image/gif") {
    return {
      body: args.body,
      contentType: "image/gif",
      extension: ".gif",
    };
  }

  try {
    const image = sharp(args.body, { failOn: "none" }).rotate();
    const metadata = await image.metadata();
    const resizedImage = image.resize({
      width: 1800,
      height: 1800,
      fit: "inside",
      withoutEnlargement: true,
    });

    if (metadata.hasAlpha) {
      return {
        body: await resizedImage.webp({ quality: 82 }).toBuffer(),
        contentType: "image/webp",
        extension: ".webp",
      };
    }

    return {
      body: await resizedImage.jpeg({ mozjpeg: true, quality: 82 }).toBuffer(),
      contentType: "image/jpeg",
      extension: ".jpg",
    };
  } catch (error) {
    const convertedBuffer = await tryConvertWithSips(args.body, contentType);
    if (convertedBuffer) {
      return {
        body: convertedBuffer,
        contentType: "image/jpeg",
        extension: ".jpg",
      };
    }

    console.warn(
      `Falling back to original image bytes for content type ${contentType || "unknown"}.`,
      error,
    );
    return {
      body: args.body,
      contentType: contentType || "application/octet-stream",
      extension: getExtensionForContentType(contentType),
    };
  }
}

function dedupeStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}

function hasOnlyBackblazeUrls(
  photos: readonly string[],
  photoMain?: string,
): boolean {
  const values = photoMain ? [photoMain, ...photos] : [...photos];
  return values.length > 0 && values.every((value) => isBackblazeUrl(value));
}

function loadEnvLocal(): void {
  const envLocalPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envLocalPath)) {
    return;
  }

  const envLocal = fs.readFileSync(envLocalPath, "utf8");
  for (const line of envLocal.split("\n")) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmedLine.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, equalsIndex).trim();
    const value = trimmedLine.slice(equalsIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  if (!process.env.CONVEX_MIGRATION_URL && process.env.NEXT_PUBLIC_CONVEX_URL) {
    process.env.CONVEX_MIGRATION_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
  }
}

function readJsonFile<T>(relativePath: string): T {
  const filePath = path.join(__dirname, "..", relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

async function tryConvertWithSips(
  body: Buffer,
  contentType: string,
): Promise<Buffer | null> {
  const supportedSipsTypes = new Set(["image/heic", "image/heif"]);
  if (!supportedSipsTypes.has(contentType)) {
    return null;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "teltplass-heic-"));
  const inputPath = path.join(tempDir, `input${getExtensionForContentType(contentType)}`);
  const outputPath = path.join(tempDir, "output.jpg");

  try {
    fs.writeFileSync(inputPath, body);
    await execFileAsync("sips", ["-s", "format", "jpeg", inputPath, "--out", outputPath]);
    return fs.readFileSync(outputPath);
  } finally {
    for (const filePath of [inputPath, outputPath]) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  }
}

function getExtensionForContentType(contentType: string): string {
  switch (contentType) {
    case "image/gif":
      return ".gif";
    case "image/heic":
      return ".heic";
    case "image/heif":
      return ".heif";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/jpeg":
    default:
      return ".jpg";
  }
}

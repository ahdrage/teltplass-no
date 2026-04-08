const DEFAULT_IMAGE_EXTENSION = ".jpg";

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export interface BackblazeObjectKeyOptions {
  folder: string;
  entityId: string;
  fileName: string;
  contentType?: string;
}

export function buildBackblazeObjectKey(
  options: BackblazeObjectKeyOptions,
): string {
  const extension = getImageExtension(options.fileName, options.contentType);
  const baseName = getBaseName(options.fileName);
  const normalizedBaseName = sanitizePathSegment(baseName) || "image";
  const normalizedFolder = sanitizePathSegment(options.folder) || "uploads";
  const normalizedEntityId = sanitizePathSegment(options.entityId) || "unknown";

  return `images/${normalizedFolder}/${normalizedEntityId}/${normalizedBaseName}${extension}`;
}

export function buildBackblazePublicUrl(
  baseUrl: string,
  objectKey: string,
): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const normalizedObjectKey = objectKey.replace(/^\/+/, "");
  return `${normalizedBaseUrl}/${normalizedObjectKey}`;
}

export function deriveBackblazePublicBaseUrl(
  endpoint: string,
  bucketName: string,
): string {
  const normalizedEndpoint = endpoint.replace(/\/+$/, "");
  const normalizedBucketName = bucketName.replace(/^\/+|\/+$/g, "");
  return `${normalizedEndpoint}/${normalizedBucketName}`;
}

export function extractBackblazeObjectKey(
  fileUrl: string,
  baseUrl: string,
): string | null {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  if (!fileUrl.startsWith(normalizedBaseUrl)) {
    return null;
  }

  const objectKey = fileUrl.slice(normalizedBaseUrl.length).replace(/^\/+/, "");
  return objectKey || null;
}

function getBaseName(fileName: string): string {
  const trimmedFileName = fileName.trim();
  const extension = /\.[^.]+$/.exec(trimmedFileName)?.[0] ?? "";
  return trimmedFileName.slice(0, trimmedFileName.length - extension.length);
}

function getImageExtension(fileName: string, contentType?: string): string {
  const fileExtension = /\.[^.]+$/.exec(fileName.trim())?.[0]?.toLowerCase();
  if (fileExtension && isSupportedImageExtension(fileExtension)) {
    return fileExtension === ".jpeg" ? ".jpg" : fileExtension;
  }

  const normalizedContentType = contentType?.split(";")[0]?.trim().toLowerCase();
  if (normalizedContentType && CONTENT_TYPE_EXTENSIONS[normalizedContentType]) {
    return CONTENT_TYPE_EXTENSIONS[normalizedContentType];
  }

  return DEFAULT_IMAGE_EXTENSION;
}

function isSupportedImageExtension(extension: string): boolean {
  return [".gif", ".jpeg", ".jpg", ".png", ".webp"].includes(extension);
}

function sanitizePathSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

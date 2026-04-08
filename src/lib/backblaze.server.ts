import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  buildBackblazeObjectKey,
  buildBackblazePublicUrl,
  deriveBackblazePublicBaseUrl,
} from "@/lib/backblaze";

const UPLOAD_URL_EXPIRY_SECONDS = 60 * 5;

interface BackblazeConfig {
  applicationKey: string;
  applicationKeyId: string;
  bucketName: string;
  endpoint: string;
  publicBaseUrl: string;
  region: string;
}

export interface BackblazeUploadTarget {
  objectKey: string;
  publicUrl: string;
  uploadUrl: string;
}

let cachedClient: S3Client | null = null;
let cachedConfig: BackblazeConfig | null = null;

export async function createBackblazeUploadTarget(args: {
  contentType?: string;
  entityId: string;
  fileName: string;
  folder: string;
}): Promise<BackblazeUploadTarget> {
  const config = getBackblazeConfig();
  const client = getBackblazeClient();
  const objectKey = buildBackblazeObjectKey({
    folder: args.folder,
    entityId: args.entityId,
    fileName: args.fileName,
    contentType: args.contentType,
  });
  const publicUrl = buildBackblazePublicUrl(config.publicBaseUrl, objectKey);
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: objectKey,
    ContentType: args.contentType || "image/jpeg",
    CacheControl: "public, max-age=31536000, immutable",
  });

  return {
    objectKey,
    publicUrl,
    uploadUrl: await getSignedUrl(client, command, {
      expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
    }),
  };
}

export async function uploadBufferToBackblaze(args: {
  body: Buffer;
  contentType?: string;
  entityId: string;
  fileName: string;
  folder: string;
}): Promise<string> {
  const config = getBackblazeConfig();
  const client = getBackblazeClient();
  const objectKey = buildBackblazeObjectKey({
    folder: args.folder,
    entityId: args.entityId,
    fileName: args.fileName,
    contentType: args.contentType,
  });

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
      Body: args.body,
      ContentType: args.contentType || "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return buildBackblazePublicUrl(config.publicBaseUrl, objectKey);
}

function getBackblazeClient(): S3Client {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getBackblazeConfig();
  cachedClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.applicationKeyId,
      secretAccessKey: config.applicationKey,
    },
  });

  return cachedClient;
}

function getBackblazeConfig(): BackblazeConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const applicationKeyId = process.env.BACKBLAZE_KEY_ID;
  const applicationKey = process.env.BACKBLAZE_APPLICATION_KEY;
  const bucketName = process.env.BACKBLAZE_BUCKET_NAME;
  const endpoint = process.env.BACKBLAZE_ENDPOINT;
  const publicBaseUrl =
    process.env.BACKBLAZE_PUBLIC_BASE_URL ||
    (endpoint && bucketName
      ? deriveBackblazePublicBaseUrl(endpoint, bucketName)
      : undefined);
  const region = process.env.BACKBLAZE_REGION || "us-east-005";

  const missingEnvironmentVariables = [
    ["BACKBLAZE_KEY_ID", applicationKeyId],
    ["BACKBLAZE_APPLICATION_KEY", applicationKey],
    ["BACKBLAZE_BUCKET_NAME", bucketName],
    ["BACKBLAZE_ENDPOINT", endpoint],
    ["BACKBLAZE_PUBLIC_BASE_URL", publicBaseUrl],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingEnvironmentVariables.length > 0) {
    throw new Error(
      `Missing Backblaze configuration: ${missingEnvironmentVariables.join(", ")}`,
    );
  }

  cachedConfig = {
    applicationKey: applicationKey!,
    applicationKeyId: applicationKeyId!,
    bucketName: bucketName!,
    endpoint: endpoint!,
    publicBaseUrl: publicBaseUrl!,
    region,
  };

  return cachedConfig;
}

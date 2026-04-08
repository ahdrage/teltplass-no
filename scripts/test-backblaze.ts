import * as fs from "fs";
import * as path from "path";

import { DeleteObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { buildBackblazePublicUrl, deriveBackblazePublicBaseUrl } from "../src/lib/backblaze";

loadEnvLocal();

void (async function main(): Promise<void> {
  const bucketName = process.env.BACKBLAZE_BUCKET_NAME;
  const endpoint = process.env.BACKBLAZE_ENDPOINT;
  const region = process.env.BACKBLAZE_REGION || "us-east-005";
  const accessKeyId = process.env.BACKBLAZE_KEY_ID;
  const secretAccessKey = process.env.BACKBLAZE_APPLICATION_KEY;

  const missingEnvironmentVariables = [
    ["BACKBLAZE_BUCKET_NAME", bucketName],
    ["BACKBLAZE_ENDPOINT", endpoint],
    ["BACKBLAZE_KEY_ID", accessKeyId],
    ["BACKBLAZE_APPLICATION_KEY", secretAccessKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingEnvironmentVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvironmentVariables.join(", ")}`,
    );
  }

  const resolvedBucketName = bucketName!;
  const resolvedEndpoint = endpoint!;
  const resolvedAccessKeyId = accessKeyId!;
  const resolvedSecretAccessKey = secretAccessKey!;

  const client = new S3Client({
    region,
    endpoint: resolvedEndpoint,
    credentials: {
      accessKeyId: resolvedAccessKeyId,
      secretAccessKey: resolvedSecretAccessKey,
    },
  });

  await client.send(new HeadBucketCommand({ Bucket: resolvedBucketName }));
  console.log(`Connected to bucket ${resolvedBucketName}.`);

  const objectKey = `tests/connectivity/${Date.now()}-hello.txt`;
  const body = Buffer.from("teltplass backblaze connectivity test\n", "utf8");
  await client.send(
    new PutObjectCommand({
      Bucket: resolvedBucketName,
      Key: objectKey,
      Body: body,
      ContentType: "text/plain; charset=utf-8",
      CacheControl: "no-store",
    }),
  );

  const publicBaseUrl =
    process.env.BACKBLAZE_PUBLIC_BASE_URL ||
    deriveBackblazePublicBaseUrl(resolvedEndpoint, resolvedBucketName);
  const publicUrl = buildBackblazePublicUrl(publicBaseUrl, objectKey);
  console.log(`Uploaded test object to ${objectKey}.`);
  console.log(`Checking public URL: ${publicUrl}`);

  const response = await fetch(publicUrl, {
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) {
    throw new Error(`Public fetch failed with status ${response.status}`);
  }

  const text = await response.text();
  if (text !== body.toString("utf8")) {
    throw new Error("Public fetch succeeded but content did not match upload.");
  }

  console.log("Public fetch succeeded and matched uploaded content.");

  await client.send(
    new DeleteObjectCommand({
      Bucket: resolvedBucketName,
      Key: objectKey,
    }),
  );
  console.log("Deleted test object.");
})().catch((error: unknown) => {
  console.error("Backblaze test failed.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
});

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
}

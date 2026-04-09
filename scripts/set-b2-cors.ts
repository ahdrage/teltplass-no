import { config } from "dotenv";
config({ path: ".env.local" });
import { PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.BACKBLAZE_ENDPOINT!;
const region = process.env.BACKBLAZE_REGION || "us-east-005";
const bucketName = process.env.BACKBLAZE_BUCKET_NAME!;

const client = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: process.env.BACKBLAZE_KEY_ID!,
    secretAccessKey: process.env.BACKBLAZE_APPLICATION_KEY!,
  },
});

async function main() {
  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: ["*"],
            AllowedMethods: ["PUT"],
            AllowedHeaders: ["Content-Type"],
            MaxAgeSeconds: 86400,
          },
        ],
      },
    }),
  );

  console.log(`CORS configured on bucket "${bucketName}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBackblazeObjectKey,
  buildBackblazePublicUrl,
  deriveBackblazePublicBaseUrl,
  extractBackblazeObjectKey,
} from "@/lib/backblaze";

test("buildBackblazeObjectKey creates a stable image path", () => {
  assert.equal(
    buildBackblazeObjectKey({
      folder: "places",
      entityId: "place_123",
      fileName: "My Nice Photo.JPG",
    }),
    "images/places/place_123/my-nice-photo.jpg",
  );
});

test("buildBackblazeObjectKey falls back to jpg when missing extension", () => {
  assert.equal(
    buildBackblazeObjectKey({
      folder: "submissions",
      entityId: "submission_123",
      fileName: "uploaded-image",
      contentType: "image/webp",
    }),
    "images/submissions/submission_123/uploaded-image.webp",
  );
});

test("buildBackblazePublicUrl normalizes duplicate slashes", () => {
  assert.equal(
    buildBackblazePublicUrl(
      "https://f005.backblazeb2.com/file/teltplass-images/",
      "/images/places/place_123/my-nice-photo.jpg",
    ),
    "https://f005.backblazeb2.com/file/teltplass-images/images/places/place_123/my-nice-photo.jpg",
  );
});

test("extractBackblazeObjectKey returns the object key for a public url", () => {
  assert.equal(
    extractBackblazeObjectKey(
      "https://f005.backblazeb2.com/file/teltplass-images/images/places/place_123/my-nice-photo.jpg",
      "https://f005.backblazeb2.com/file/teltplass-images/",
    ),
    "images/places/place_123/my-nice-photo.jpg",
  );
});

test("extractBackblazeObjectKey returns null for urls outside the bucket", () => {
  assert.equal(
    extractBackblazeObjectKey(
      "https://example.com/images/places/place_123/my-nice-photo.jpg",
      "https://f005.backblazeb2.com/file/teltplass-images/",
    ),
    null,
  );
});

test("deriveBackblazePublicBaseUrl creates a path-style public base url", () => {
  assert.equal(
    deriveBackblazePublicBaseUrl(
      "https://s3.eu-central-003.backblazeb2.com",
      "teltplass-images",
    ),
    "https://s3.eu-central-003.backblazeb2.com/teltplass-images",
  );
});

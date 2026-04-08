import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCityImageSourceBySlug,
  buildPlaceImageSourceByOldPath,
  normalizeImageUrl,
} from "@/lib/imageSourceData";

test("normalizeImageUrl adds https to protocol-relative urls", () => {
  assert.equal(
    normalizeImageUrl("//s3.amazonaws.com/example/image.jpg"),
    "https://s3.amazonaws.com/example/image.jpg",
  );
});

test("buildCityImageSourceBySlug maps city images by slug", () => {
  const sources = buildCityImageSourceBySlug([
    {
      Slug: "oslo",
      image: "//s3.amazonaws.com/example/oslo.jpg",
    },
  ]);

  assert.equal(
    sources.get("oslo"),
    "https://s3.amazonaws.com/example/oslo.jpg",
  );
});

test("buildPlaceImageSourceByOldPath prefers photo main and includes gallery images", () => {
  const sources = buildPlaceImageSourceByOldPath([
    {
      approved: "ja",
      title: "Burudvann-odden",
      "unique id": "1650917950024x165459032041062400",
      "photo main": "//s3.amazonaws.com/example/main.jpg",
      "photo gallery":
        "//s3.amazonaws.com/example/gallery-1.jpg,//s3.amazonaws.com/example/gallery-2.jpg",
    },
  ]);

  assert.deepEqual(
    sources.get("/c/burudvann-odden-1650917950024x165459032041062400"),
    {
      photoMain: "https://s3.amazonaws.com/example/main.jpg",
      photos: [
        "https://s3.amazonaws.com/example/main.jpg",
        "https://s3.amazonaws.com/example/gallery-1.jpg",
        "https://s3.amazonaws.com/example/gallery-2.jpg",
      ],
    },
  );
});

test("buildPlaceImageSourceByOldPath skips non-approved records", () => {
  const sources = buildPlaceImageSourceByOldPath([
    {
      approved: "nei",
      title: "Hidden place",
      "unique id": "123",
      "photo gallery": "//s3.amazonaws.com/example/hidden.jpg",
    },
  ]);

  assert.equal(sources.size, 0);
});

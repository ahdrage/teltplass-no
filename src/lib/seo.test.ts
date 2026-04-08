import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLegacyPlacePath,
  buildSitemapEntries,
  getLegacyRedirectTarget,
} from "@/lib/seo";

test("getLegacyRedirectTarget maps known legacy routes", () => {
  assert.equal(getLegacyRedirectTarget("/s"), "/kart");
  assert.equal(getLegacyRedirectTarget("/p/oslo"), "/steder/oslo");
  assert.equal(getLegacyRedirectTarget("/nettstedskart.xml"), "/sitemap.xml");
  assert.equal(getLegacyRedirectTarget("/unknown"), null);
});

test("buildLegacyPlacePath recreates the stored old place path", () => {
  assert.equal(buildLegacyPlacePath(["foo", "bar"]), "/c/foo/bar");
});

test("buildSitemapEntries creates standard URLs for pages, cities, and places", () => {
  const entries = buildSitemapEntries({
    baseUrl: "https://teltplass.no",
    cities: [{ slug: "oslo" }],
    places: [{ slug: "burudvann-odden" }],
  });

  assert.deepEqual(
    entries.map((entry) => entry.url),
    [
      "https://teltplass.no/",
      "https://teltplass.no/kart",
      "https://teltplass.no/sok",
      "https://teltplass.no/ny",
      "https://teltplass.no/steder/oslo",
      "https://teltplass.no/teltplass/burudvann-odden",
    ],
  );
});

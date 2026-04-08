import test from "node:test";
import assert from "node:assert/strict";

import {
  collectVisibleStorageIds,
  dedupeCities,
  dedupePlaces,
  getVisibleItems,
  pickBestCityRecord,
} from "@/lib/homeData";

interface TestCity {
  _id: string;
  _creationTime: number;
  name: string;
  slug: string;
  placeCount: number;
  image?: string;
}

test("pickBestCityRecord prefers the city with more places and an image", () => {
  const first: TestCity = {
    _id: "city-1",
    _creationTime: 1,
    name: "Oslo",
    slug: "oslo",
    placeCount: 8,
  };
  const second: TestCity = {
    _id: "city-2",
    _creationTime: 2,
    name: "Oslo",
    slug: "oslo",
    placeCount: 12,
    image: "img-2",
  };

  assert.equal(pickBestCityRecord([first, second])?._id, "city-2");
});

test("dedupeCities keeps one city per slug and sorts by place count", () => {
  const cities: TestCity[] = [
    {
      _id: "city-1",
      _creationTime: 1,
      name: "Nordmarka",
      slug: "nordmarka",
      placeCount: 10,
    },
    {
      _id: "city-2",
      _creationTime: 2,
      name: "Oslo",
      slug: "oslo",
      placeCount: 20,
      image: "img-1",
    },
    {
      _id: "city-3",
      _creationTime: 3,
      name: "Oslo",
      slug: "oslo",
      placeCount: 18,
    },
  ];

  assert.deepEqual(
    dedupeCities(cities).map((city) => city._id),
    ["city-2", "city-1"],
  );
});

test("getVisibleItems returns a smaller initial slice until expanded", () => {
  const items = ["a", "b", "c", "d", "e"];

  assert.deepEqual(getVisibleItems(items, 3, false), ["a", "b", "c"]);
  assert.deepEqual(getVisibleItems(items, 3, true), items);
});

test("dedupePlaces keeps one place per slug", () => {
  const places = [
    {
      _id: "place-1",
      _creationTime: 1,
      slug: "burudvann",
      createdAt: 10,
      photos: [],
    },
    {
      _id: "place-2",
      _creationTime: 2,
      slug: "burudvann",
      createdAt: 20,
      photos: ["img-1"],
      photoMain: "img-1",
    },
    {
      _id: "place-3",
      _creationTime: 3,
      slug: "ostersjovannet",
      createdAt: 30,
      photos: [],
    },
  ];

  assert.deepEqual(
    dedupePlaces(places).map((place) => place._id),
    ["place-2", "place-3"],
  );
});

test("collectVisibleStorageIds keeps first-seen ids and skips missing values", () => {
  const ids = collectVisibleStorageIds([
    "img-1",
    undefined,
    "img-2",
    "img-1",
    null,
    "img-3",
  ]);

  assert.deepEqual(ids, ["img-1", "img-2", "img-3"]);
});

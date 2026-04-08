import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  dedupePlaces,
  pickBestCityRecord,
  pickBestPlaceRecord,
} from "../src/lib/homeData";

export const list = query({
  args: { onlyApproved: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.onlyApproved !== false) {
      const places = await ctx.db
        .query("places")
        .withIndex("by_approved", (q) => q.eq("approved", true))
        .collect();
      return dedupePlaces(places);
    }
    const places = await ctx.db.query("places").collect();
    return dedupePlaces(places);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const places = await ctx.db
      .query("places")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    return pickBestPlaceRecord(places) ?? null;
  },
});

export const getByOldPath = query({
  args: { oldPath: v.string() },
  handler: async (ctx, args) => {
    const places = await ctx.db
      .query("places")
      .withIndex("by_old_path", (q) => q.eq("oldPath", args.oldPath))
      .collect();
    return pickBestPlaceRecord(places) ?? null;
  },
});

export const featured = query({
  args: {},
  handler: async (ctx) => {
    const places = await ctx.db
      .query("places")
      .withIndex("by_approved", (q) => q.eq("approved", true))
      .collect();
    return dedupePlaces(places)
      .filter((p) => (p.photoMain !== undefined || p.photos.length > 0))
      .slice(0, 8);
  },
});

export const nearby = query({
  args: { lat: v.number(), lng: v.number(), excludeSlug: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("places")
      .withIndex("by_approved", (q) => q.eq("approved", true))
      .collect();

    const withDist = dedupePlaces(all)
      .filter((p) => p.slug !== args.excludeSlug)
      .map((p) => ({
        ...p,
        distance: haversine(args.lat, args.lng, p.lat, p.lng),
      }))
      .sort((a, b) => a.distance - b.distance);

    return withDist.slice(0, args.limit ?? 4);
  },
});

export const forCity = query({
  args: { citySlug: v.string() },
  handler: async (ctx, args) => {
    const cities = await ctx.db
      .query("cities")
      .withIndex("by_slug", (q) => q.eq("slug", args.citySlug))
      .collect();
    const city = pickBestCityRecord(cities);
    if (!city) return [];

    const all = await ctx.db
      .query("places")
      .withIndex("by_approved", (q) => q.eq("approved", true))
      .collect();

    return dedupePlaces(all)
      .map((p) => ({
        ...p,
        distance: haversine(city.lat, city.lng, p.lat, p.lng),
      }))
      .filter((p) => p.distance <= 30)
      .sort((a, b) => a.distance - b.distance);
  },
});

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const approve = mutation({
  args: { id: v.id("places"), approved: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { approved: args.approved });
  },
});

export const remove = mutation({
  args: { id: v.id("places") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("places"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    amenities: v.optional(v.array(v.string())),
    approved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(id, filtered);
    }
  },
});

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

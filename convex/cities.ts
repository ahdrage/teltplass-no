import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { dedupeCities, pickBestCityRecord } from "../src/lib/homeData";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const cities = await ctx.db.query("cities").collect();
    return dedupeCities(cities);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const cities = await ctx.db
      .query("cities")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    return pickBestCityRecord(cities) ?? null;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    const slug = args.name
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const allPlaces = await ctx.db
      .query("places")
      .withIndex("by_approved", (q) => q.eq("approved", true))
      .collect();

    const R = 6371;
    const placeCount = allPlaces.filter((p) => {
      const dLat = ((p.lat - args.lat) * Math.PI) / 180;
      const dLon = ((p.lng - args.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((args.lat * Math.PI) / 180) *
          Math.cos((p.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= 30;
    }).length;

    return await ctx.db.insert("cities", {
      name: args.name,
      slug,
      lat: args.lat,
      lng: args.lng,
      placeCount,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("cities"),
    name: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    if (filtered.name) {
      (filtered as Record<string, unknown>).slug = (filtered.name as string)
        .toLowerCase()
        .replace(/æ/g, "ae")
        .replace(/ø/g, "o")
        .replace(/å/g, "a")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(id, filtered);
    }
  },
});

export const remove = mutation({
  args: { id: v.id("cities") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

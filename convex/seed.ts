import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const insertPlace = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    address: v.string(),
    lat: v.number(),
    lng: v.number(),
    amenities: v.array(v.string()),
    photos: v.array(v.id("_storage")),
    photoMain: v.optional(v.id("_storage")),
    approved: v.boolean(),
    oldPath: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("places", args);
  },
});

export const insertCity = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    lat: v.number(),
    lng: v.number(),
    image: v.optional(v.id("_storage")),
    placeCount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cities", args);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

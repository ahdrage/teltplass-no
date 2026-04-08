import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listAllPlaces = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("places").collect();
  },
});

export const listAllCities = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cities").collect();
  },
});

export const listAllSubmissions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("submissions").collect();
  },
});

export const updatePlaceImages = mutation({
  args: {
    id: v.id("places"),
    photoMain: v.optional(v.string()),
    photos: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      photoMain: args.photoMain,
      photos: args.photos,
    });
  },
});

export const updateCityImage = mutation({
  args: {
    id: v.id("cities"),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      image: args.image,
    });
  },
});

export const updateSubmissionImages = mutation({
  args: {
    id: v.id("submissions"),
    photos: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      photos: args.photos,
    });
  },
});

export const deleteStorageFiles = mutation({
  args: {
    storageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.storageIds.map((storageId) => ctx.storage.delete(storageId)),
    );
  },
});

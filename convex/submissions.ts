import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    address: v.string(),
    lat: v.number(),
    lng: v.number(),
    amenities: v.array(v.string()),
    photos: v.array(v.id("_storage")),
    submitterEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("submissions", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("submissions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("submissions").collect();
  },
});

export const approve = mutation({
  args: { id: v.id("submissions") },
  handler: async (ctx, args) => {
    const sub = await ctx.db.get(args.id);
    if (!sub) throw new Error("Submission not found");

    const slug = sub.title
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    await ctx.db.insert("places", {
      title: sub.title,
      slug,
      description: sub.description,
      address: sub.address,
      lat: sub.lat,
      lng: sub.lng,
      amenities: sub.amenities,
      photos: sub.photos,
      photoMain: sub.photos[0],
      approved: true,
      createdAt: sub.createdAt,
    });

    await ctx.db.patch(args.id, { status: "approved" });
  },
});

export const reject = mutation({
  args: { id: v.id("submissions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "rejected" });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

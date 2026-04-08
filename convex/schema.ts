import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  places: defineTable({
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    address: v.string(),
    lat: v.number(),
    lng: v.number(),
    amenities: v.array(v.string()),
    photos: v.array(v.string()),
    photoMain: v.optional(v.string()),
    approved: v.boolean(),
    oldPath: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_approved", ["approved"])
    .index("by_approved_and_created", ["approved", "createdAt"])
    .index("by_old_path", ["oldPath"]),

  cities: defineTable({
    name: v.string(),
    slug: v.string(),
    lat: v.number(),
    lng: v.number(),
    image: v.optional(v.string()),
    placeCount: v.number(),
  }).index("by_slug", ["slug"]),

  newsletter_subscribers: defineTable({
    email: v.string(),
    subscribedAt: v.number(),
  }).index("by_email", ["email"]),

  submissions: defineTable({
    title: v.string(),
    description: v.string(),
    address: v.string(),
    lat: v.number(),
    lng: v.number(),
    amenities: v.array(v.string()),
    photos: v.array(v.string()),
    submitterEmail: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    createdAt: v.number(),
  }).index("by_status", ["status"]),
});

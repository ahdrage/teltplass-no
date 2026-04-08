import type { MetadataRoute } from "next";

import { api } from "../../convex/_generated/api";
import { getConvexClient } from "../lib/convex-server";
import { buildSitemapEntries } from "@/lib/seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://teltplass.no";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const convex = getConvexClient();
  const [places, cities] = await Promise.all([
    convex.query(api.places.list, { onlyApproved: true }),
    convex.query(api.cities.list, {}),
  ]);

  return buildSitemapEntries({
    baseUrl: siteUrl,
    cities,
    places,
  }).map((entry) => ({
    url: entry.url,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}

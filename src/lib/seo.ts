export interface SitemapSlug {
  slug: string;
}

export interface SitemapEntry {
  url: string;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
}

interface BuildSitemapEntriesOptions {
  baseUrl: string;
  cities: readonly SitemapSlug[];
  places: readonly SitemapSlug[];
}

const STATIC_REDIRECTS: Record<string, string> = {
  "/s": "/kart",
  "/nettstedskart.xml": "/sitemap.xml",
};

export function getLegacyRedirectTarget(pathname: string): string | null {
  if (pathname in STATIC_REDIRECTS) {
    return STATIC_REDIRECTS[pathname];
  }

  if (pathname.startsWith("/p/")) {
    return pathname.replace(/^\/p\//, "/steder/");
  }

  return null;
}

export function buildLegacyPlacePath(pathSegments: string[] | undefined): string {
  return `/c/${pathSegments?.join("/") ?? ""}`;
}

export function buildSitemapEntries({
  baseUrl,
  cities,
  places,
}: BuildSitemapEntriesOptions): SitemapEntry[] {
  const staticPages: SitemapEntry[] = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/kart`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/sok`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/ny`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const cityPages = cities.map((city) => ({
    url: `${baseUrl}/steder/${city.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const placePages = places.map((place) => ({
    url: `${baseUrl}/teltplass/${place.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...cityPages, ...placePages];
}

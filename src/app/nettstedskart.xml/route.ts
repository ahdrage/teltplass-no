import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  const [places, cities] = await Promise.all([
    convex.query(api.places.list, { onlyApproved: true }),
    convex.query(api.cities.list, {}),
  ]);

  const baseUrl = "https://teltplass.no";

  const staticPages = [
    { loc: "/", changefreq: "weekly", priority: "1.0" },
    { loc: "/kart", changefreq: "daily", priority: "0.9" },
    { loc: "/sok", changefreq: "weekly", priority: "0.7" },
    { loc: "/ny", changefreq: "monthly", priority: "0.5" },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (p) => `  <url>
    <loc>${baseUrl}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
${cities
  .map(
    (c) => `  <url>
    <loc>${baseUrl}/steder/${c.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join("\n")}
${places
  .map(
    (p) => `  <url>
    <loc>${baseUrl}/teltplass/${p.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

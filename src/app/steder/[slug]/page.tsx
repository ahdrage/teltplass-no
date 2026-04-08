import type { Metadata } from "next";
import { api } from "../../../../convex/_generated/api";
import { getConvexClient } from "../../../lib/convex-server";
import StederContent from "./StederContent";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://teltplass.no";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const convex = getConvexClient();

  const city = await convex.query(api.cities.getBySlug, { slug });
  if (!city) return { title: "Sted ikke funnet" };

  const title = `Teltplasser ${city.name}`;
  const description = `Finn ${city.placeCount} teltplasser nær ${city.name}. Utforsk de beste stedene å sette opp telt i nærheten.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteUrl}/steder/${slug}`,
      images: [
        {
          url: `${siteUrl}/teltplass.webp`,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl}/teltplass.webp`],
    },
  };
}

export default function StederPage() {
  return <StederContent />;
}

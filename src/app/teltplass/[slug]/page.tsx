import type { Metadata } from "next";
import { api } from "../../../../convex/_generated/api";
import { getConvexClient } from "../../../lib/convex-server";
import TeltplassContent from "./TeltplassContent";
import { Id } from "../../../../convex/_generated/dataModel";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://teltplass.no";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const convex = getConvexClient();

  const place = await convex.query(api.places.getBySlug, { slug });
  if (!place) return { title: "Teltplass ikke funnet" };

  let imageUrl: string | undefined;
  const firstPhoto = place.photoMain ?? place.photos?.[0];
  if (firstPhoto) {
    imageUrl =
      (await convex.query(api.storage.getUrl, {
        storageId: firstPhoto as Id<"_storage">,
      })) ?? undefined;
  }

  const title = place.title;
  const description =
    place.description?.slice(0, 155) ||
    `Teltplass ved ${place.address}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteUrl}/teltplass/${slug}`,
      ...(imageUrl && {
        images: [{ url: imageUrl, alt: title }],
      }),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default function TeltplassPage() {
  return <TeltplassContent />;
}

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Link from "next/link";
import Image from "next/image";
import { AMENITY_CONFIG } from "../lib/constants";

interface PlaceCardProps {
  title: string;
  slug: string;
  description: string;
  amenities: string[];
  photoMain?: Id<"_storage">;
  imageUrl?: string | null;
  distance?: number;
  index?: number;
  prefetch?: boolean;
  preload?: boolean;
}

export function PlaceCard({
  title,
  slug,
  description,
  amenities,
  photoMain,
  imageUrl,
  distance,
  index = 0,
  prefetch = false,
  preload = false,
}: PlaceCardProps) {
  return (
    <Link
      href={`/teltplass/${slug}`}
      prefetch={prefetch}
      className="group block bg-[var(--color-cloud)] rounded-xl border border-[var(--color-stone)]/15 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200 animate-fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-[var(--color-sand)]">
        {photoMain ? (
          <StorageImage
            storageId={photoMain}
            imageUrl={imageUrl}
            alt={title}
            preload={preload}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <PlaceholderImage />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg text-[var(--color-bark)] group-hover:text-[var(--color-ember)] transition-colors line-clamp-1">
          {title}
        </h3>
        {distance !== undefined && (
          <p className="font-mono text-xs text-[var(--color-stone)] mt-1">
            {distance.toFixed(1)} km unna
          </p>
        )}
        {description && (
          <p className="font-body text-sm text-[var(--color-stone)] mt-2 line-clamp-2">
            {description}
          </p>
        )}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {amenities.slice(0, 4).map((a) => (
              <AmenityBadge key={a} amenity={a} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function StorageImage({
  storageId,
  imageUrl,
  alt,
  className = "",
  preload = false,
  sizes,
}: {
  storageId: Id<"_storage">;
  imageUrl?: string | null;
  alt: string;
  className?: string;
  preload?: boolean;
  sizes?: string;
}) {
  const fallbackUrl = useQuery(
    api.storage.getUrl,
    imageUrl ? "skip" : { storageId },
  );
  const url = imageUrl ?? fallbackUrl;
  const [failed, setFailed] = useState(false);
  if (!url) {
    return <div className={`w-full h-full bg-[var(--color-sand)] animate-pulse ${className}`} />;
  }
  if (failed) return <PlaceholderImage />;
  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      loading={preload ? "eager" : "lazy"}
      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${className}`}
      onError={() => setFailed(true)}
      unoptimized={url.includes(".convex.cloud")}
    />
  );
}

export function PlaceholderImage() {
  return (
    <div className="w-full h-full relative overflow-hidden">
      <img
        src="/teltplass.webp"
        alt=""
        className="w-full h-full object-cover blur-[6px] scale-110 brightness-90"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bark)]/15">
        <svg
          width="36"
          height="36"
          viewBox="0 0 40 40"
          fill="none"
          className="text-white/60 drop-shadow-md"
        >
          <path d="M20 4L36 36H4L20 4Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

export function AmenityBadge({ amenity }: { amenity: string }) {
  const config = AMENITY_CONFIG[amenity.trim()];
  if (!config) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-moss)] text-white text-xs font-body">
      <span
        className="w-3 h-3"
        dangerouslySetInnerHTML={{ __html: config.icon }}
      />
      {config.label}
    </span>
  );
}

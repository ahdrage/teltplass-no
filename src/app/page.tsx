"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { trackEvent } from "fathom-client";
import { PlaceCard, StorageImage } from "../components/PlaceCard";
import { dedupeCities, getVisibleItems } from "@/lib/homeData";
import { FATHOM_EVENTS } from "@/lib/fathom-events";

const INITIAL_FEATURED_COUNT = 4;
const INITIAL_CITY_COUNT = 12;

export default function Home() {
  const featured = useQuery(api.places.featured);
  const cities = useQuery(api.cities.list);
  const [isFeaturedExpanded, setIsFeaturedExpanded] = useState(false);
  const [isCitiesExpanded, setIsCitiesExpanded] = useState(false);

  const visibleFeatured = featured
    ? getVisibleItems(featured, INITIAL_FEATURED_COUNT, isFeaturedExpanded)
    : [];
  const preparedCities = cities
    ? dedupeCities(cities.filter((city) => city.placeCount > 0))
    : [];
  const visibleCities = getVisibleItems(
    preparedCities,
    INITIAL_CITY_COUNT,
    isCitiesExpanded,
  );

  return (
    <>
      {/* Hero */}
      <section className="relative h-[85vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/teltplass.webp"
            alt="Norsk natur"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-night)] via-[var(--color-night)]/40 to-transparent" />
        </div>
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 md:pb-20">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white max-w-2xl leading-tight animate-fade-up">
            Finn teltplasser i hele Norge
          </h1>
          <p
            className="font-body text-lg text-[var(--color-sand)]/80 mt-4 max-w-xl animate-fade-up"
            style={{ animationDelay: "100ms" }}
          >
            Utforsk over 130 teltplasser, delt av friluftsfolk for friluftsfolk.
          </p>
          <div
            className="flex flex-wrap gap-3 mt-8 animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            <Link
              href="/kart"
              className="px-6 py-3 rounded-lg bg-[var(--color-ember)] text-white font-body font-semibold text-base hover:bg-[var(--color-ember-hover)] transition-colors shadow-lg"
            >
              Finn teltplasser
            </Link>
            <Link
              href="/ny"
              className="px-6 py-3 rounded-lg bg-white/10 backdrop-blur-sm text-white font-body font-semibold text-base border border-white/30 hover:bg-white/20 transition-colors"
            >
              Legg til teltplass
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Places */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <h2 className="font-display text-3xl md:text-4xl text-[var(--color-bark)] mb-2">
          Utvalgte steder
        </h2>
        <p className="font-body text-[var(--color-stone)] mb-10">
          Populære teltplasser med bilder fra fellesskapet
        </p>
        {featured ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {visibleFeatured.map((place, i) => (
                <PlaceCard
                  key={place._id}
                  title={place.title}
                  slug={place.slug}
                  description={place.description}
                  amenities={place.amenities}
                  imageUrl={place.photoMain ?? place.photos[0] ?? null}
                  index={i}
                  preload={i < 2}
                  linkSource="home"
                />
              ))}
            </div>
            {featured.length > INITIAL_FEATURED_COUNT ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-lg border border-[var(--color-stone)]/30 text-[var(--color-bark)] font-body font-semibold hover:bg-[var(--color-cloud)] transition-colors"
                  aria-expanded={isFeaturedExpanded}
                  onClick={() => setIsFeaturedExpanded((value) => !value)}
                >
                  {isFeaturedExpanded
                    ? "Vis færre teltplasser"
                    : "Vis flere teltplasser"}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: INITIAL_FEATURED_COUNT }).map((_, i) => (
              <div
                key={i}
                className="bg-[var(--color-cloud)] rounded-xl border border-[var(--color-stone)]/15 overflow-hidden"
              >
                <div className="aspect-[4/3] bg-[var(--color-sand)] animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-[var(--color-sand)] rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-[var(--color-sand)] rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cities */}
      <section className="bg-[var(--color-cloud)] topo-bg py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--color-bark)] mb-2">
            Utforsk etter sted
          </h2>
          <p className="font-body text-[var(--color-stone)] mb-10">
            Finn teltplasser nær din neste destinasjon
          </p>
          {cities ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {visibleCities.map((city, i) => (
                  <CityCard
                    key={city._id}
                    city={city}
                    index={i}
                    imageUrl={city.image ?? null}
                  />
                ))}
              </div>
              {preparedCities.length > INITIAL_CITY_COUNT ? (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-lg border border-[var(--color-stone)]/30 text-[var(--color-bark)] font-body font-semibold hover:bg-white transition-colors"
                    aria-expanded={isCitiesExpanded}
                    onClick={() => setIsCitiesExpanded((value) => !value)}
                  >
                    {isCitiesExpanded ? "Vis færre steder" : "Vis flere steder"}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: INITIAL_CITY_COUNT }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-[var(--color-sand)] rounded-xl animate-pulse"
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function CityCard({
  city,
  index,
  imageUrl,
}: {
  city: {
    _id: string;
    name: string;
    slug: string;
    placeCount: number;
    image?: string;
  };
  index: number;
  imageUrl?: string | null;
}) {
  return (
    <Link
      href={`/steder/${city.slug}`}
      prefetch={false}
      onClick={() => trackEvent(FATHOM_EVENTS.BROWSE_CITY)}
      className="group relative aspect-[3/4] rounded-xl overflow-hidden animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="absolute inset-0 bg-[var(--color-night)]">
        {city.image && (
          <StorageImage
            imageUrl={imageUrl}
            alt={city.name}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-night)]/80 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="font-display text-base text-white leading-tight">
          {city.name}
        </h3>
        <p className="font-mono text-xs text-[var(--color-sand)]/70 mt-0.5">
          {city.placeCount} plasser
        </p>
      </div>
    </Link>
  );
}

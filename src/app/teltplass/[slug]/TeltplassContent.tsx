"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StorageImage, PlaceholderImage, AmenityBadge, PlaceCard } from "../../../components/PlaceCard";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "../../../lib/constants";
import { Id } from "../../../../convex/_generated/dataModel";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function TeltplassContent() {
  const { slug } = useParams<{ slug: string }>();
  const place = useQuery(api.places.getBySlug, { slug });
  const nearby = useQuery(
    api.places.nearby,
    place ? { lat: place.lat, lng: place.lng, excludeSlug: slug, limit: 4 } : "skip"
  );
  const [activePhoto, setActivePhoto] = useState(0);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !place) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [place.lng, place.lat],
      zoom: 13,
      interactive: true,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    new mapboxgl.Marker({ color: "#C8593A" })
      .setLngLat([place.lng, place.lat])
      .addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [place]);

  if (!place) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="aspect-[16/9] bg-[var(--color-stone)]/10 rounded-xl animate-pulse mb-8" />
        <div className="h-8 w-1/3 bg-[var(--color-stone)]/10 rounded animate-pulse mb-4" />
        <div className="h-4 w-2/3 bg-[var(--color-stone)]/10 rounded animate-pulse" />
      </div>
    );
  }

  const allPhotos = place.photos;
  const hasPhotos = allPhotos.length > 0;

  return (
    <>
      {/* Photo gallery */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[var(--color-sand)]">
          {hasPhotos ? (
            <GalleryImage storageId={allPhotos[activePhoto]} alt={place.title} />
          ) : (
            <PlaceholderImage />
          )}
          {allPhotos.length > 1 && (
            <>
              <button
                onClick={() => setActivePhoto((p) => (p - 1 + allPhotos.length) % allPhotos.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button
                onClick={() => setActivePhoto((p) => (p + 1) % allPhotos.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allPhotos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === activePhoto ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {allPhotos.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {allPhotos.map((id, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === activePhoto ? "border-[var(--color-ember)]" : "border-transparent"
                }`}
              >
                <GalleryImage storageId={id} alt={`${place.title} ${i + 1}`} />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Details */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-[1fr_360px] gap-10">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-[var(--color-bark)] animate-fade-up">
              {place.title}
            </h1>
            <p className="font-body text-sm text-[var(--color-stone)] mt-2">
              {place.address}
            </p>

            {place.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {place.amenities.map((a) => (
                  <AmenityBadge key={a} amenity={a} />
                ))}
              </div>
            )}

            {place.description && (
              <div className="mt-6">
                <p className="font-body text-[var(--color-bark)] leading-relaxed whitespace-pre-line">
                  {place.description}
                </p>
              </div>
            )}

            <div className="mt-6 font-mono text-xs text-[var(--color-stone)]">
              {place.lat.toFixed(6)}, {place.lng.toFixed(6)}
            </div>
          </div>

          {/* Map sidebar */}
          <div>
            <div ref={mapContainer} className="w-full h-[280px] rounded-xl overflow-hidden border border-[var(--color-stone)]/15" />
            <ShareButton title={place.title} slug={place.slug} />
          </div>
        </div>
      </section>

      {/* Nearby */}
      {nearby && nearby.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 border-t border-[var(--color-stone)]/15">
          <h2 className="font-display text-2xl text-[var(--color-bark)] mb-6">
            Nærliggende teltplasser
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {nearby.map((p, i) => (
              <PlaceCard
                key={p._id}
                title={p.title}
                slug={p.slug}
                description={p.description}
                amenities={p.amenities}
                photoMain={p.photoMain ?? p.photos?.[0]}
                distance={p.distance}
                index={i}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function GalleryImage({ storageId, alt }: { storageId: Id<"_storage">; alt: string }) {
  const url = useQuery(api.storage.getUrl, { storageId });
  const [failed, setFailed] = useState(false);
  if (!url) return <div className="w-full h-full bg-[var(--color-sand)] animate-pulse" />;
  if (failed) return <PlaceholderImage />;
  return <img src={url} alt={alt} className="w-full h-full object-cover" onError={() => setFailed(true)} />;
}

function ShareButton({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const url = `${window.location.origin}/teltplass/${slug}`;
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleShare}
      className="mt-3 w-full px-4 py-2.5 rounded-lg border border-[var(--color-stone)]/20 font-body text-sm text-[var(--color-bark)] hover:bg-[var(--color-stone)]/10 transition-colors flex items-center justify-center gap-2"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
      </svg>
      {copied ? "Kopiert!" : "Del denne plassen"}
    </button>
  );
}

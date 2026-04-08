"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Fuse from "fuse.js";
import { PlaceCard } from "../../components/PlaceCard";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "../../lib/constants";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function SokPage() {
  const [query, setQuery] = useState("");
  const places = useQuery(api.places.list, { onlyApproved: true });
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const fuse = useMemo(() => {
    if (!places) return null;
    return new Fuse(places, {
      keys: [
        { name: "title", weight: 3 },
        { name: "description", weight: 1 },
        { name: "address", weight: 2 },
        { name: "amenities", weight: 1 },
      ],
      threshold: 0.35,
      includeScore: true,
    });
  }, [places]);

  const results = useMemo(() => {
    if (!query.trim() || !fuse) return places ?? [];
    return fuse.search(query).map((r) => r.item);
  }, [query, fuse, places]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [10.5, 63.5],
      zoom: 4,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !results.length) return;

    const markers = document.querySelectorAll(".search-marker");
    markers.forEach((m) => m.remove());

    results.forEach((p) => {
      const el = document.createElement("div");
      el.className = "search-marker";
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#C8593A";
      el.style.border = "2px solid #F5F0E8";
      el.style.cursor = "pointer";
      new mapboxgl.Marker(el).setLngLat([p.lng, p.lat]).addTo(map);
    });

    if (results.length === 1) {
      map.flyTo({ center: [results[0].lng, results[0].lat], zoom: 12 });
    } else if (results.length > 1 && results.length < (places?.length ?? 0)) {
      const bounds = new mapboxgl.LngLatBounds();
      results.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 60 });
    }
  }, [results, places]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
      {/* Results panel */}
      <div className="lg:w-[420px] flex-shrink-0 overflow-y-auto border-r border-[var(--color-stone)]/15 bg-[var(--color-sand)]">
        <div className="sticky top-0 z-10 bg-[var(--color-sand)] border-b border-[var(--color-stone)]/15 p-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={useCallback((el: HTMLInputElement | null) => el?.focus(), [])}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søk etter teltplass, sted, eller fasiliteter..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--color-cloud)] border border-[var(--color-stone)]/20 font-body text-sm text-[var(--color-bark)] placeholder:text-[var(--color-stone)] focus:outline-none focus:border-[var(--color-ember)] transition-colors"
            />
          </div>
          <p className="font-mono text-xs text-[var(--color-stone)] mt-2">
            {results.length} treff
          </p>
        </div>
        <div className="p-4 space-y-4">
          {results.map((place, i) => (
            <PlaceCard
              key={place._id}
              title={place.title}
              slug={place.slug}
              description={place.description}
              amenities={place.amenities}
              photoMain={place.photoMain ?? place.photos?.[0]}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainer} className="flex-1 min-h-[300px]" />
    </div>
  );
}

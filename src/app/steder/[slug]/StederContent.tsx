"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PlaceCard, StorageImage } from "../../../components/PlaceCard";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "../../../lib/constants";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function StederContent() {
  const { slug } = useParams<{ slug: string }>();
  const city = useQuery(api.cities.getBySlug, { slug });
  const places = useQuery(api.places.forCity, { citySlug: slug });
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !city) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [city.lng, city.lat],
      zoom: 9,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [city]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !places) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    places.forEach((p) => {
      const el = document.createElement("div");
      el.style.width = "18px";
      el.style.height = "18px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#C8593A";
      el.style.border = "2px solid #F5F0E8";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        new mapboxgl.Popup({ offset: 12, maxWidth: "250px" })
          .setLngLat([p.lng, p.lat])
          .setHTML(`<div style="padding:10px;font-family:'Source Sans 3',sans-serif"><a href="/teltplass/${p.slug}" style="font-family:'DM Serif Display',serif;font-size:15px;color:#2C2418;text-decoration:none">${p.title}</a><br><span style="font-size:12px;color:#8C8578">${p.distance?.toFixed(1)} km unna</span></div>`)
          .addTo(map);
      });
      const marker = new mapboxgl.Marker(el).setLngLat([p.lng, p.lat]).addTo(map);
      markersRef.current.push(marker);
    });
  }, [places]);

  if (!city) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-60 bg-[var(--color-stone)]/10 rounded-xl animate-pulse mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-[var(--color-stone)]/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[280px] overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-night)]">
          {city.image && <StorageImage storageId={city.image} alt={city.name} className="opacity-60" />}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-night)]/80 to-transparent" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-10">
          <h1 className="font-display text-4xl md:text-5xl text-white animate-fade-up">
            Teltplasser {city.name}
          </h1>
          <p className="font-mono text-sm text-[var(--color-sand)]/70 mt-2 animate-fade-up" style={{ animationDelay: "100ms" }}>
            {places?.length ?? "..."} teltplasser innen 30 km
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Place grid */}
          <div className="grid sm:grid-cols-2 gap-5">
            {places?.map((place, i) => (
              <PlaceCard
                key={place._id}
                title={place.title}
                slug={place.slug}
                description={place.description}
                amenities={place.amenities}
                photoMain={place.photoMain ?? place.photos?.[0]}
                distance={place.distance}
                index={i}
              />
            ))}
          </div>

          {/* Sticky map */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <div ref={mapContainer} className="w-full h-[500px] rounded-xl overflow-hidden border border-[var(--color-stone)]/15" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

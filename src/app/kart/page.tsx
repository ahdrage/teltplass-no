"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN, AMENITY_CONFIG } from "../../lib/constants";
import Link from "next/link";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function KartPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const places = useQuery(api.places.list, { onlyApproved: true });

  const filteredPlaces = places?.filter((p) => {
    if (selectedFilters.length === 0) return true;
    return selectedFilters.every((f) => p.amenities.includes(f));
  });

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [10.5, 63.5],
      zoom: 4.5,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("load", () => setMapLoaded(true));
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !filteredPlaces) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: filteredPlaces.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        properties: {
          id: p._id,
          title: p.title,
          slug: p.slug,
          description: p.description?.slice(0, 100) || "",
          hasPhoto: p.photos.length > 0,
        },
      })),
    };

    if (map.getSource("places")) {
      (map.getSource("places") as mapboxgl.GeoJSONSource).setData(geojson);
      return;
    }

    map.addSource("places", {
      type: "geojson",
      data: geojson,
      cluster: true,
      clusterMaxZoom: 12,
      clusterRadius: 50,
    });

    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "places",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#C8593A",
        "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 30, 32],
        "circle-opacity": 0.85,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#F5F0E8",
      },
    });

    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "places",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 13,
      },
      paint: { "text-color": "#ffffff" },
    });

    map.addLayer({
      id: "unclustered-point",
      type: "circle",
      source: "places",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "#C8593A",
        "circle-radius": 10,
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#F5F0E8",
      },
    });

    map.on("click", "clusters", (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
      const clusterId = features[0]?.properties?.cluster_id;
      if (clusterId == null) return;
      const source = map.getSource("places") as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null) return;
        const coords = (features[0].geometry as GeoJSON.Point).coordinates;
        map.easeTo({ center: coords as [number, number], zoom });
      });
    });

    map.on("click", "unclustered-point", (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const coords = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const { title, slug, description } = feature.properties as any;
      new mapboxgl.Popup({ offset: 15, maxWidth: "280px" })
        .setLngLat(coords)
        .setHTML(`
          <div style="padding: 12px; font-family: 'Source Sans 3', sans-serif;">
            <h3 style="font-family: 'DM Serif Display', serif; font-size: 16px; margin: 0 0 4px 0; color: #2C2418;">
              <a href="/teltplass/${slug}" style="color: inherit; text-decoration: none;">${title}</a>
            </h3>
            <p style="font-size: 13px; color: #8C8578; margin: 0 0 8px 0; line-height: 1.4;">${description}...</p>
            <a href="/teltplass/${slug}" style="font-size: 13px; color: #C8593A; text-decoration: none; font-weight: 600;">Se mer &rarr;</a>
          </div>
        `)
        .addTo(map);
    });

    map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });
    map.on("mouseenter", "unclustered-point", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "unclustered-point", () => { map.getCanvas().style.cursor = ""; });
  }, [mapLoaded, filteredPlaces]);

  const toggleFilter = useCallback((amenity: string) => {
    setSelectedFilters((prev) =>
      prev.includes(amenity)
        ? prev.filter((f) => f !== amenity)
        : [...prev, amenity]
    );
  }, []);

  return (
    <div className="relative h-[calc(100vh-64px)] map-fullscreen">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Filter bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap gap-2 pointer-events-none">
        <Link
          href="/sok"
          className="pointer-events-auto px-4 py-2.5 rounded-lg bg-[var(--color-cloud)] shadow-md border border-[var(--color-stone)]/15 font-body text-sm text-[var(--color-stone)] hover:text-[var(--color-bark)] transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          Søk etter sted...
        </Link>
        {Object.entries(AMENITY_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`pointer-events-auto px-3 py-2 rounded-lg text-xs font-body font-medium shadow-sm border transition-all ${
              selectedFilters.includes(key)
                ? "bg-[var(--color-moss)] text-white border-[var(--color-moss)]"
                : "bg-[var(--color-cloud)] text-[var(--color-bark)] border-[var(--color-stone)]/15 hover:border-[var(--color-moss)]"
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Place count */}
      <div className="absolute bottom-6 left-4 z-10">
        <div className="px-4 py-2 rounded-lg bg-[var(--color-cloud)]/90 backdrop-blur-sm shadow-md font-mono text-sm text-[var(--color-bark)]">
          {filteredPlaces?.length ?? "..."} teltplasser
        </div>
      </div>
    </div>
  );
}

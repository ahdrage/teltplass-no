"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { trackEvent } from "fathom-client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN, AMENITY_CONFIG } from "../../lib/constants";
import { FATHOM_EVENTS } from "@/lib/fathom-events";
import Link from "next/link";
import { PlaceCard } from "../../components/PlaceCard";

mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapViewport {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
}

export default function KartPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [viewport, setViewport] = useState<MapViewport | null>(null);
  const places = useQuery(api.places.list, { onlyApproved: true });

  const filteredPlaces = useMemo(
    () =>
      places?.filter((p) => {
        if (selectedFilters.length === 0) return true;
        return selectedFilters.every((f) => p.amenities.includes(f));
      }) ?? [],
    [places, selectedFilters],
  );

  const updateViewport = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    if (!bounds) return;
    const center = map.getCenter();

    setViewport({
      bounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      },
      center: {
        lat: center.lat,
        lng: center.lng,
      },
    });
  }, []);

  const visiblePlaces = useMemo(() => {
    if (!viewport) {
      return filteredPlaces;
    }

    const {
      bounds: { north, south, east, west },
      center,
    } = viewport;

    return filteredPlaces
      .filter((place) => {
        const inLatBounds = place.lat >= south && place.lat <= north;
        const inLngBounds =
          west <= east
            ? place.lng >= west && place.lng <= east
            : place.lng >= west || place.lng <= east;

        return inLatBounds && inLngBounds;
      })
      .sort((a, b) => {
        const aDistance =
          (a.lat - center.lat) ** 2 + (a.lng - center.lng) ** 2;
        const bDistance =
          (b.lat - center.lat) ** 2 + (b.lng - center.lng) ** 2;
        return aDistance - bDistance;
      });
  }, [filteredPlaces, viewport]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [10.5, 63.5],
      zoom: 4.5,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const handleLoad = () => {
      setMapLoaded(true);
      updateViewport();
    };

    map.on("load", handleLoad);
    map.on("moveend", updateViewport);
    mapRef.current = map;

    return () => {
      map.off("load", handleLoad);
      map.off("moveend", updateViewport);
      map.remove();
      mapRef.current = null;
    };
  }, [updateViewport]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

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

  useEffect(() => {
    if (!mapLoaded) return;
    updateViewport();
  }, [mapLoaded, filteredPlaces, updateViewport]);

  const toggleFilter = useCallback((amenity: string) => {
    trackEvent(FATHOM_EVENTS.TOGGLE_MAP_FILTER);
    setSelectedFilters((prev) =>
      prev.includes(amenity)
        ? prev.filter((f) => f !== amenity)
        : [...prev, amenity]
    );
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
      <div className="order-2 lg:order-1 lg:w-[420px] flex-shrink-0 overflow-y-auto border-r border-[var(--color-stone)]/15 bg-[var(--color-sand)]">
        <div className="sticky top-0 z-10 bg-[var(--color-sand)] border-b border-[var(--color-stone)]/15 p-4 space-y-3">
          <Link
            href="/sok"
            className="w-full px-4 py-3 rounded-xl bg-[var(--color-cloud)] border border-[var(--color-stone)]/20 font-body text-sm text-[var(--color-stone)] hover:text-[var(--color-bark)] transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Søk etter teltplass, sted eller fasiliteter...
          </Link>

          <div className="flex flex-wrap gap-2">
            {Object.entries(AMENITY_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => toggleFilter(key)}
                className={`px-3 py-2 rounded-lg text-xs font-body font-medium shadow-sm border transition-all ${
                  selectedFilters.includes(key)
                    ? "bg-[var(--color-moss)] text-white border-[var(--color-moss)]"
                    : "bg-[var(--color-cloud)] text-[var(--color-bark)] border-[var(--color-stone)]/15 hover:border-[var(--color-moss)]"
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <p className="font-mono text-xs text-[var(--color-stone)]">
              {visiblePlaces.length} synlige treff
            </p>
            <p className="font-body text-xs text-[var(--color-stone)]/80">
              {filteredPlaces.length} teltplasser matcher filtrene
            </p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {places === undefined ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-[var(--color-cloud)] rounded-xl border border-[var(--color-stone)]/15 overflow-hidden"
              >
                <div className="aspect-[4/3] bg-[var(--color-stone)]/10 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-2/3 rounded bg-[var(--color-stone)]/10 animate-pulse" />
                  <div className="h-4 w-full rounded bg-[var(--color-stone)]/10 animate-pulse" />
                  <div className="h-4 w-5/6 rounded bg-[var(--color-stone)]/10 animate-pulse" />
                </div>
              </div>
            ))
          ) : visiblePlaces.length > 0 ? (
            visiblePlaces.map((place, index) => (
              <PlaceCard
                key={place._id}
                title={place.title}
                slug={place.slug}
                description={place.description}
                amenities={place.amenities}
                imageUrl={place.photoMain ?? place.photos?.[0] ?? null}
                index={index}
                linkSource="search"
              />
            ))
          ) : (
            <div className="rounded-2xl border border-[var(--color-stone)]/15 bg-[var(--color-cloud)] p-5">
              <h2 className="font-display text-xl text-[var(--color-bark)]">
                Ingen teltplasser i kartutsnittet
              </h2>
              <p className="mt-2 font-body text-sm text-[var(--color-stone)]">
                Zoom ut eller flytt kartet for å se flere plasser.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="order-1 lg:order-2 relative flex-1 min-h-[360px] lg:min-h-0 map-fullscreen">
        <div ref={mapContainer} className="h-full w-full" />

        <div className="absolute bottom-6 left-4 z-10">
          <div className="px-4 py-2 rounded-lg bg-[var(--color-cloud)]/90 backdrop-blur-sm shadow-md font-mono text-sm text-[var(--color-bark)]">
            {visiblePlaces.length} synlige / {filteredPlaces.length} totalt
          </div>
        </div>
      </div>
    </div>
  );
}

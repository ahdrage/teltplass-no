"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN, AMENITY_CONFIG } from "../../lib/constants";
import { StorageImage } from "../../components/PlaceCard";

mapboxgl.accessToken = MAPBOX_TOKEN;

type Step = "location" | "details" | "amenities" | "photos" | "done";

export default function NyPage() {
  const [step, setStep] = useState<Step>("location");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const createSubmission = useMutation(api.submissions.create);

  const handleSubmit = useCallback(async () => {
    if (!lat || !lng || !title.trim()) return;
    setSubmitting(true);
    await createSubmission({
      title: title.trim(),
      description: description.trim(),
      address: address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      lat,
      lng,
      amenities,
      photos,
      submitterEmail: email.trim() || undefined,
    });
    setStep("done");
    setSubmitting(false);
  }, [lat, lng, title, description, address, amenities, photos, createSubmission]);

  const handlePhotoUpload = useCallback(
    async (files: FileList) => {
      setUploading(true);
      const uploadedPhotoUrls: string[] = [];
      for (const file of Array.from(files).slice(0, 12 - photos.length)) {
        const uploadTargetResponse = await fetch("/api/uploads/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: file.type,
            fileName: file.name,
          }),
        });
        if (!uploadTargetResponse.ok) {
          continue;
        }

        const { publicUrl, uploadUrl } = (await uploadTargetResponse.json()) as {
          publicUrl: string;
          uploadUrl: string;
        };
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (uploadResponse.ok) {
          uploadedPhotoUrls.push(publicUrl);
        }
      }
      setPhotos((prev) => [...prev, ...uploadedPhotoUrls]);
      setUploading(false);
    },
    [photos]
  );

  if (step === "done") {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-moss)]/10 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-moss)" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="font-display text-3xl text-[var(--color-bark)] mb-4">
          Takk for bidraget!
        </h1>
        <p className="font-body text-[var(--color-stone)]">
          Teltplassen din er sendt inn og vil bli gjennomgått av oss. Når den er godkjent, vil den dukke opp på kartet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      <h1 className="font-display text-3xl md:text-4xl text-[var(--color-bark)] mb-2">
        Legg til ny teltplass
      </h1>
      <p className="font-body text-[var(--color-stone)] mb-8">
        Del din favoritteltplass med resten av Norge
      </p>

      {/* Progress */}
      <div className="flex gap-1 mb-10">
        {(["location", "details", "amenities", "photos"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              (["location", "details", "amenities", "photos"] as Step[]).indexOf(step) >= i
                ? "bg-[var(--color-ember)]"
                : "bg-[var(--color-stone)]/20"
            }`}
          />
        ))}
      </div>

      {step === "location" && (
        <LocationStep
          lat={lat}
          lng={lng}
          address={address}
          onSelect={(lat, lng, addr) => {
            setLat(lat);
            setLng(lng);
            setAddress(addr);
          }}
          onNext={() => setStep("details")}
        />
      )}

      {step === "details" && (
        <div className="space-y-6">
          <div>
            <label className="block font-body text-sm font-semibold text-[var(--color-bark)] mb-2">
              Tittel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="F.eks. Burudvann-odden"
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-cloud)] border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)] transition-colors"
            />
          </div>
          <div>
            <label className="block font-body text-sm font-semibold text-[var(--color-bark)] mb-2">
              Beskrivelse
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Beskriv stedet, hvordan komme seg hit, hva som gjør det spesielt..."
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-cloud)] border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)] transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block font-body text-sm font-semibold text-[var(--color-bark)] mb-2">
              Din e-post
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="namn@eksempel.no"
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-cloud)] border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)] transition-colors"
            />
            <p className="font-body text-xs text-[var(--color-stone)] mt-1.5">
              Så vi kan kontakte deg om teltplassen. Vises ikke offentlig.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("location")} className="px-5 py-3 rounded-lg border border-[var(--color-stone)]/30 font-body text-sm font-medium text-[var(--color-bark)] hover:bg-[var(--color-stone)]/10 transition-colors">
              Tilbake
            </button>
            <button
              onClick={() => setStep("amenities")}
              disabled={!title.trim()}
              className="px-5 py-3 rounded-lg bg-[var(--color-ember)] text-white font-body text-sm font-medium hover:bg-[var(--color-ember-hover)] transition-colors disabled:opacity-40"
            >
              Neste
            </button>
          </div>
        </div>
      )}

      {step === "amenities" && (
        <div className="space-y-6">
          <p className="font-body text-sm text-[var(--color-stone)]">
            Velg fasiliteter som finnes på stedet
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(AMENITY_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() =>
                  setAmenities((prev) =>
                    prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
                  )
                }
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-left font-body text-sm transition-all ${
                  amenities.includes(key)
                    ? "bg-[var(--color-moss)] text-white border-[var(--color-moss)]"
                    : "bg-[var(--color-cloud)] text-[var(--color-bark)] border-[var(--color-stone)]/20 hover:border-[var(--color-moss)]"
                }`}
              >
                <span className="w-5 h-5" dangerouslySetInnerHTML={{ __html: config.icon }} />
                {config.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("details")} className="px-5 py-3 rounded-lg border border-[var(--color-stone)]/30 font-body text-sm font-medium text-[var(--color-bark)] hover:bg-[var(--color-stone)]/10 transition-colors">
              Tilbake
            </button>
            <button onClick={() => setStep("photos")} className="px-5 py-3 rounded-lg bg-[var(--color-ember)] text-white font-body text-sm font-medium hover:bg-[var(--color-ember-hover)] transition-colors">
              Neste
            </button>
          </div>
        </div>
      )}

      {step === "photos" && (
        <div className="space-y-6">
          <p className="font-body text-sm text-[var(--color-stone)]">
            Last opp bilder av teltplassen (valgfritt, maks 12)
          </p>
          <label className="block border-2 border-dashed border-[var(--color-stone)]/30 rounded-xl p-8 text-center cursor-pointer hover:border-[var(--color-ember)] transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
            />
            <svg className="mx-auto mb-3 text-[var(--color-stone)]" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <span className="font-body text-sm text-[var(--color-stone)]">
              {uploading ? "Laster opp..." : "Klikk for å laste opp bilder"}
            </span>
          </label>
          {photos.length > 0 && (
            <div className="space-y-2">
              <p className="font-mono text-xs text-[var(--color-moss)]">
                {photos.length} bilde{photos.length !== 1 ? "r" : ""} lastet opp
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {photos.map((imageUrl, i) => (
                  <div key={imageUrl} className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--color-stone)]/15">
                    <StorageImage imageUrl={imageUrl} alt={`Bilde ${i + 1}`} className="rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--color-night)]/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep("amenities")} className="px-5 py-3 rounded-lg border border-[var(--color-stone)]/30 font-body text-sm font-medium text-[var(--color-bark)] hover:bg-[var(--color-stone)]/10 transition-colors">
              Tilbake
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 rounded-lg bg-[var(--color-ember)] text-white font-body text-sm font-semibold hover:bg-[var(--color-ember-hover)] transition-colors disabled:opacity-50"
            >
              {submitting ? "Sender..." : "Send inn teltplass"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface GeoFeature {
  place_name: string;
  center: [number, number];
}

function LocationStep({
  lat,
  lng,
  address,
  onSelect,
  onNext,
}: {
  lat: number | null;
  lng: number | null;
  address: string;
  onSelect: (lat: number, lng: number, addr: string) => void;
  onNext: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [lng ?? 10.5, lat ?? 62],
      zoom: lat ? 12 : 5,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    if (lat && lng) {
      markerRef.current = new mapboxgl.Marker({ color: "#C8593A" })
        .setLngLat([lng, lat])
        .addTo(map);
    }

    map.on("click", async (e) => {
      const { lat: clickLat, lng: clickLng } = e.lngLat;
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = new mapboxgl.Marker({ color: "#C8593A" })
        .setLngLat([clickLng, clickLat])
        .addTo(map);

      let addr = `${clickLat.toFixed(6)}, ${clickLng.toFixed(6)}`;
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${clickLng},${clickLat}.json?access_token=${MAPBOX_TOKEN}&language=no`
        );
        const data = await res.json();
        if (data.features?.[0]) addr = data.features[0].place_name;
      } catch {}
      onSelect(clickLat, clickLng, addr);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=NO&language=no&limit=5&types=place,locality,neighborhood,address,poi`
      );
      const data = await res.json();
      setSuggestions(data.features ?? []);
      setShowSuggestions(true);
    } catch {}
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
  }, [fetchSuggestions]);

  const selectSuggestion = useCallback((feature: GeoFeature) => {
    const [fLng, fLat] = feature.center;
    setSearchQuery(feature.place_name);
    setSuggestions([]);
    setShowSuggestions(false);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [fLng, fLat], zoom: 12 });
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !mapRef.current) return;
    setShowSuggestions(false);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&country=NO&language=no`
      );
      const data = await res.json();
      if (data.features?.[0]) {
        const [fLng, fLat] = data.features[0].center;
        mapRef.current.flyTo({ center: [fLng, fLat], zoom: 12 });
      }
    } catch {}
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      <p className="font-body text-sm text-[var(--color-stone)]">
        Klikk på kartet for å velge plassering
      </p>
      <div className="flex gap-2" ref={wrapperRef}>
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
              if (e.key === "Escape") setShowSuggestions(false);
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Søk etter sted..."
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-cloud)] border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)] transition-colors"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-lg border border-[var(--color-stone)]/20 shadow-lg overflow-hidden">
              {suggestions.map((feat, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => selectSuggestion(feat)}
                    className="w-full text-left px-4 py-2.5 font-body text-sm text-[var(--color-bark)] hover:bg-[var(--color-sand)]/50 transition-colors flex items-start gap-2.5"
                  >
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--color-stone)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="line-clamp-1">{feat.place_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={handleSearch} className="px-4 py-2.5 rounded-lg bg-[var(--color-bark)] text-white font-body text-sm">
          Søk
        </button>
      </div>
      <div ref={containerRef} className="w-full h-[400px] rounded-xl overflow-hidden border border-[var(--color-stone)]/20" />
      {lat && lng && (
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-[var(--color-stone)]">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
            {address && (
              <p className="font-body text-sm text-[var(--color-bark)] mt-0.5">{address}</p>
            )}
          </div>
          <button
            onClick={onNext}
            className="px-5 py-3 rounded-lg bg-[var(--color-ember)] text-white font-body text-sm font-medium hover:bg-[var(--color-ember-hover)] transition-colors"
          >
            Neste
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN, AMENITY_CONFIG } from "../../lib/constants";
import { Id } from "../../../convex/_generated/dataModel";

mapboxgl.accessToken = MAPBOX_TOKEN;

type Step = "location" | "details" | "amenities" | "photos" | "done";

export default function NyPage() {
  const [step, setStep] = useState<Step>("location");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Id<"_storage">[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const createSubmission = useMutation(api.submissions.create);
  const generateUploadUrl = useMutation(api.submissions.generateUploadUrl);

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
    });
    setStep("done");
    setSubmitting(false);
  }, [lat, lng, title, description, address, amenities, photos, createSubmission]);

  const handlePhotoUpload = useCallback(
    async (files: FileList) => {
      setUploading(true);
      const newIds: Id<"_storage">[] = [];
      for (const file of Array.from(files).slice(0, 12 - photos.length)) {
        const url = await generateUploadUrl();
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (res.ok) {
          const { storageId } = await res.json();
          newIds.push(storageId);
        }
      }
      setPhotos((prev) => [...prev, ...newIds]);
      setUploading(false);
    },
    [photos, generateUploadUrl]
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
            <p className="font-mono text-xs text-[var(--color-moss)]">
              {photos.length} bilde{photos.length !== 1 ? "r" : ""} lastet opp
            </p>
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

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !mapRef.current) return;
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
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Søk etter sted..."
          className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--color-cloud)] border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)] transition-colors"
        />
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

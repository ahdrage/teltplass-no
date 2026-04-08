"use client";

import { useState, useMemo, Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useSearchParams } from "next/navigation";
import Fuse from "fuse.js";
import { StorageImage } from "../../components/PlaceCard";
import { MAPBOX_TOKEN, AMENITY_CONFIG } from "../../lib/constants";

const ADMIN_PASSWORD = "teltplass-admin-2026";

function staticMapUrl(lat: number, lng: number, width = 400, height = 200): string {
  return `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/pin-s+C8593A(${lng},${lat})/${lng},${lat},12,0/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="max-w-sm mx-auto px-4 py-24"><div className="h-8 bg-[var(--color-stone)]/10 rounded-xl animate-pulse" /></div>}>
      <AdminContent />
    </Suspense>
  );
}

function AdminContent() {
  const searchParams = useSearchParams();
  const bypassKey = searchParams.get("key") === ADMIN_PASSWORD;
  const [authenticated, setAuthenticated] = useState(bypassKey);
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<"submissions" | "places" | "cities" | "subscribers">("submissions");

  if (!authenticated) {
    return (
      <div className="max-w-sm mx-auto px-4 py-24">
        <h1 className="font-display text-2xl text-[var(--color-bark)] mb-6 text-center">
          Admin
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password === ADMIN_PASSWORD) setAuthenticated(true);
          }}
          className="space-y-4"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passord"
            className="w-full px-4 py-3 rounded-xl bg-[var(--color-cloud)] border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)]"
          />
          <button className="w-full px-4 py-3 rounded-xl bg-[var(--color-ember)] text-white font-body font-medium text-sm hover:bg-[var(--color-ember-hover)]">
            Logg inn
          </button>
        </form>
      </div>
    );
  }

  const tabLabels: Record<typeof tab, string> = {
    submissions: "Innsendte",
    places: "Steder",
    cities: "Byer",
    subscribers: "Abonnenter",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl text-[var(--color-bark)] mb-6">Admin</h1>

      <div className="flex gap-1 mb-6 bg-[var(--color-cloud)] p-1 rounded-xl border border-[var(--color-stone)]/15 w-fit">
        {(Object.keys(tabLabels) as (typeof tab)[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-body text-sm font-medium transition-colors ${
              tab === t
                ? "bg-[var(--color-bark)] text-white"
                : "text-[var(--color-bark)] hover:bg-[var(--color-stone)]/10"
            }`}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {tab === "submissions" && <SubmissionsTab />}
      {tab === "places" && <PlacesTab />}
      {tab === "cities" && <CitiesTab />}
      {tab === "subscribers" && <SubscribersTab />}
    </div>
  );
}

/* ─── Submissions ─── */

function SubmissionsTab() {
  const submissions = useQuery(api.submissions.listAll);
  const approveSubmission = useMutation(api.submissions.approve);
  const rejectSubmission = useMutation(api.submissions.reject);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!submissions) return <Loading />;

  const pending = submissions.filter((s) => s.status === "pending");
  const others = submissions.filter((s) => s.status !== "pending");

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-[var(--color-bark)]">
        Ventende ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <p className="font-body text-sm text-[var(--color-stone)]">Ingen ventende innsendte steder.</p>
      ) : (
        pending.map((sub) => {
          const isExpanded = expandedId === sub._id;
          return (
            <div
              key={sub._id}
              className="bg-[var(--color-cloud)] rounded-xl border border-[var(--color-stone)]/15 overflow-hidden"
            >
              <div
                className="p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-[var(--color-stone)]/5 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : sub._id)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base text-[var(--color-bark)]">{sub.title}</h3>
                    <svg className={`w-4 h-4 text-[var(--color-stone)] transition-transform ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                  <p className="font-body text-sm text-[var(--color-stone)] mt-0.5">{sub.address}</p>
                  <p className="font-mono text-xs text-[var(--color-stone)] mt-1">
                    {sub.photos.length} bilder &middot; {sub.amenities.join(", ") || "Ingen fasiliteter"}
                    {sub.submitterEmail && <> &middot; {sub.submitterEmail}</>}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => approveSubmission({ id: sub._id })}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-moss)] text-white font-body text-xs font-medium hover:opacity-90"
                  >
                    Godkjenn
                  </button>
                  <button
                    onClick={() => rejectSubmission({ id: sub._id })}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white font-body text-xs font-medium hover:opacity-90"
                  >
                    Avvis
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-[var(--color-stone)]/10 space-y-4">
                  <p className="font-body text-sm text-[var(--color-stone)] mt-3">{sub.description}</p>

                  <div className="rounded-lg overflow-hidden border border-[var(--color-stone)]/15">
                    <img
                      src={staticMapUrl(sub.lat, sub.lng)}
                      alt={`Kart: ${sub.title}`}
                      className="w-full h-[200px] object-cover"
                      loading="lazy"
                    />
                  </div>

                  <p className="font-mono text-xs text-[var(--color-stone)]">
                    {sub.lat.toFixed(6)}, {sub.lng.toFixed(6)}
                  </p>

                  {sub.photos.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {sub.photos.map((photoId, i) => (
                        <div key={photoId} className="aspect-square rounded-lg overflow-hidden border border-[var(--color-stone)]/15">
                          <StorageImage imageUrl={photoId} alt={`Bilde ${i + 1}`} className="rounded-lg" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
      {others.length > 0 && (
        <>
          <h2 className="font-display text-xl text-[var(--color-bark)] mt-8">Behandlet</h2>
          {others.map((sub) => (
            <div
              key={sub._id}
              className="bg-[var(--color-cloud)] rounded-xl border border-[var(--color-stone)]/15 p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-display text-base text-[var(--color-bark)]">{sub.title}</h3>
                <p className="font-mono text-xs text-[var(--color-stone)] mt-1">{sub.address}</p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-body font-medium ${
                  sub.status === "approved"
                    ? "bg-[var(--color-moss)]/10 text-[var(--color-moss)]"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {sub.status === "approved" ? "Godkjent" : "Avvist"}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ─── Places ─── */

function PlacesTab() {
  const places = useQuery(api.places.list, { onlyApproved: false });
  const toggleApproved = useMutation(api.places.approve);
  const removePlace = useMutation(api.places.remove);
  const updatePlace = useMutation(api.places.update);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fuse = useMemo(
    () => places ? new Fuse(places, { keys: ["title", "slug", "address"], threshold: 0.35 }) : null,
    [places]
  );

  if (!places) return <Loading />;

  const filtered = search.trim() && fuse
    ? fuse.search(search).map((r) => r.item)
    : places;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-stone)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk etter sted..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)] transition-colors"
          />
        </div>
        <p className="font-mono text-xs text-[var(--color-stone)] flex-shrink-0">
          {filtered.length}{search.trim() ? ` av ${places.length}` : ""} steder
        </p>
      </div>
      {filtered.map((p) => {
        const isExpanded = expandedId === p._id;
        return (
          <div key={p._id} className="bg-[var(--color-cloud)] rounded-xl border border-[var(--color-stone)]/15 overflow-hidden">
            <div
              className="px-4 py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-[var(--color-stone)]/5 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : p._id)}
            >
              <div className="min-w-0 flex items-center gap-2">
                <div className="min-w-0">
                  <h3 className="font-display text-sm text-[var(--color-bark)] truncate">{p.title}</h3>
                  <p className="font-mono text-xs text-[var(--color-stone)] truncate">{p.slug}</p>
                </div>
                <svg className={`w-4 h-4 flex-shrink-0 text-[var(--color-stone)] transition-transform ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-body ${
                    p.approved ? "bg-[var(--color-moss)]/10 text-[var(--color-moss)]" : "bg-red-50 text-red-600"
                  }`}
                >
                  {p.approved ? "Synlig" : "Skjult"}
                </span>
                <button
                  onClick={() => toggleApproved({ id: p._id as Id<"places">, approved: !p.approved })}
                  className="px-2 py-1 rounded-lg border border-[var(--color-stone)]/20 font-body text-xs hover:bg-[var(--color-stone)]/10"
                >
                  {p.approved ? "Skjul" : "Vis"}
                </button>
                <button
                  onClick={() => {
                    if (confirm("Slett?")) removePlace({ id: p._id as Id<"places"> });
                  }}
                  className="px-2 py-1 rounded-lg border border-red-200 text-red-600 font-body text-xs hover:bg-red-50"
                >
                  Slett
                </button>
              </div>
            </div>

            {isExpanded && (
              <PlaceEditPanel
                place={p}
                onSave={async (updates) => {
                  await updatePlace({ id: p._id as Id<"places">, ...updates });
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PlaceEditPanel({
  place,
  onSave,
}: {
  place: {
    title: string;
    description: string;
    address: string;
    lat: number;
    lng: number;
    amenities: string[];
    photos: string[];
  };
  onSave: (updates: { title?: string; description?: string; address?: string; amenities?: string[] }) => Promise<void>;
}) {
  const [title, setTitle] = useState(place.title);
  const [description, setDescription] = useState(place.description);
  const [address, setAddress] = useState(place.address);
  const [amenities, setAmenities] = useState<string[]>(place.amenities);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges =
    title !== place.title ||
    description !== place.description ||
    address !== place.address ||
    JSON.stringify(amenities) !== JSON.stringify(place.amenities);

  async function handleSave() {
    setSaving(true);
    await onSave({
      ...(title !== place.title ? { title } : {}),
      ...(description !== place.description ? { description } : {}),
      ...(address !== place.address ? { address } : {}),
      ...(JSON.stringify(amenities) !== JSON.stringify(place.amenities) ? { amenities } : {}),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="px-4 pb-4 pt-0 border-t border-[var(--color-stone)]/10 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4 mt-3">
        <div className="space-y-3">
          <div>
            <label className="block font-body text-xs font-semibold text-[var(--color-bark)] mb-1">Tittel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)]"
            />
          </div>
          <div>
            <label className="block font-body text-xs font-semibold text-[var(--color-bark)] mb-1">Adresse</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)]"
            />
          </div>
          <div>
            <label className="block font-body text-xs font-semibold text-[var(--color-bark)] mb-1">Beskrivelse</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)] resize-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg overflow-hidden border border-[var(--color-stone)]/15">
            <img
              src={staticMapUrl(place.lat, place.lng)}
              alt={`Kart: ${place.title}`}
              className="w-full h-[160px] object-cover"
              loading="lazy"
            />
          </div>
          <p className="font-mono text-xs text-[var(--color-stone)]">
            {place.lat.toFixed(6)}, {place.lng.toFixed(6)}
          </p>

          {place.photos.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5">
              {place.photos.slice(0, 8).map((photoId, i) => (
                <div key={photoId} className="aspect-square rounded-md overflow-hidden border border-[var(--color-stone)]/15">
                  <StorageImage imageUrl={photoId} alt={`Bilde ${i + 1}`} className="rounded-md" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block font-body text-xs font-semibold text-[var(--color-bark)] mb-2">Fasiliteter</label>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(AMENITY_CONFIG).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                setAmenities((prev) =>
                  prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
                )
              }
              className={`px-2.5 py-1 rounded-lg text-xs font-body font-medium border transition-all ${
                amenities.includes(key)
                  ? "bg-[var(--color-moss)] text-white border-[var(--color-moss)]"
                  : "bg-white text-[var(--color-bark)] border-[var(--color-stone)]/20 hover:border-[var(--color-moss)]"
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-4 py-2 rounded-lg bg-[var(--color-ember)] text-white font-body text-xs font-medium hover:bg-[var(--color-ember-hover)] transition-colors disabled:opacity-40"
        >
          {saving ? "Lagrer..." : "Lagre endringer"}
        </button>
        {saved && <span className="font-body text-xs text-[var(--color-moss)]">Lagret!</span>}
      </div>
    </div>
  );
}

/* ─── Cities ─── */

function CitiesTab() {
  const cities = useQuery(api.cities.list);
  const createCity = useMutation(api.cities.create);
  const updateCity = useMutation(api.cities.update);
  const removeCity = useMutation(api.cities.remove);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!cities) return <Loading />;

  const sorted = [...cities].sort((a, b) => b.placeCount - a.placeCount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-[var(--color-stone)]">{cities.length} byer totalt</p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-1.5 rounded-lg bg-[var(--color-ember)] text-white font-body text-xs font-medium hover:bg-[var(--color-ember-hover)] transition-colors"
        >
          {showAdd ? "Avbryt" : "Legg til by"}
        </button>
      </div>

      {showAdd && (
        <CityAddForm
          onAdd={async (data) => {
            await createCity(data);
            setShowAdd(false);
          }}
        />
      )}

      {sorted.map((city) => {
        const isEditing = editingId === city._id;
        return (
          <div key={city._id} className="bg-[var(--color-cloud)] rounded-xl border border-[var(--color-stone)]/15 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-display text-sm text-[var(--color-bark)]">{city.name}</h3>
                <p className="font-mono text-xs text-[var(--color-stone)]">
                  {city.slug} &middot; {city.placeCount} plasser &middot; {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditingId(isEditing ? null : city._id)}
                  className="px-2 py-1 rounded-lg border border-[var(--color-stone)]/20 font-body text-xs hover:bg-[var(--color-stone)]/10"
                >
                  {isEditing ? "Lukk" : "Rediger"}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Slett ${city.name}?`)) removeCity({ id: city._id as Id<"cities"> });
                  }}
                  className="px-2 py-1 rounded-lg border border-red-200 text-red-600 font-body text-xs hover:bg-red-50"
                >
                  Slett
                </button>
              </div>
            </div>

            {isEditing && (
              <CityEditForm
                city={city}
                onSave={async (updates) => {
                  await updateCity({ id: city._id as Id<"cities">, ...updates });
                  setEditingId(null);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CityAddForm({ onAdd }: { onAdd: (data: { name: string; lat: number; lng: number }) => Promise<void> }) {
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !lat || !lng) return;
    setAdding(true);
    await onAdd({ name: name.trim(), lat: parseFloat(lat), lng: parseFloat(lng) });
    setAdding(false);
  }

  return (
    <div className="bg-[var(--color-cloud)] rounded-xl border border-[var(--color-ember)]/30 p-4 space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-body text-xs font-semibold text-[var(--color-bark)] mb-1">Navn</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="F.eks. Bergen"
            className="w-full px-3 py-2 rounded-lg bg-white border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)]"
          />
        </div>
        <div>
          <label className="block font-body text-xs font-semibold text-[var(--color-bark)] mb-1">Breddegrad (lat)</label>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="60.3913"
            className="w-full px-3 py-2 rounded-lg bg-white border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)]"
          />
        </div>
        <div>
          <label className="block font-body text-xs font-semibold text-[var(--color-bark)] mb-1">Lengdegrad (lng)</label>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="5.3221"
            className="w-full px-3 py-2 rounded-lg bg-white border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)]"
          />
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={!name.trim() || !lat || !lng || adding}
        className="px-4 py-2 rounded-lg bg-[var(--color-ember)] text-white font-body text-xs font-medium hover:bg-[var(--color-ember-hover)] transition-colors disabled:opacity-40"
      >
        {adding ? "Legger til..." : "Legg til by"}
      </button>
    </div>
  );
}

function CityEditForm({
  city,
  onSave,
}: {
  city: { name: string; lat: number; lng: number };
  onSave: (updates: { name?: string; lat?: number; lng?: number }) => Promise<void>;
}) {
  const [name, setName] = useState(city.name);
  const [lat, setLat] = useState(String(city.lat));
  const [lng, setLng] = useState(String(city.lng));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const updates: { name?: string; lat?: number; lng?: number } = {};
    if (name !== city.name) updates.name = name;
    if (parseFloat(lat) !== city.lat) updates.lat = parseFloat(lat);
    if (parseFloat(lng) !== city.lng) updates.lng = parseFloat(lng);
    await onSave(updates);
    setSaving(false);
  }

  return (
    <div className="px-4 pb-4 pt-0 border-t border-[var(--color-stone)]/10 space-y-3">
      <div className="grid sm:grid-cols-3 gap-3 mt-3">
        <div>
          <label className="block font-body text-xs font-semibold text-[var(--color-bark)] mb-1">Navn</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)]"
          />
        </div>
        <div>
          <label className="block font-body text-xs font-semibold text-[var(--color-bark)] mb-1">Breddegrad</label>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)]"
          />
        </div>
        <div>
          <label className="block font-body text-xs font-semibold text-[var(--color-bark)] mb-1">Lengdegrad</label>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-[var(--color-stone)]/20 font-body text-sm focus:outline-none focus:border-[var(--color-ember)]"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-[var(--color-ember)] text-white font-body text-xs font-medium hover:bg-[var(--color-ember-hover)] transition-colors disabled:opacity-40"
      >
        {saving ? "Lagrer..." : "Lagre"}
      </button>
    </div>
  );
}

/* ─── Subscribers ─── */

function SubscribersTab() {
  const subscribers = useQuery(api.newsletter.list);

  if (!subscribers) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-[var(--color-stone)]">{subscribers.length} abonnenter</p>
        <button
          onClick={() => {
            const csv = "email,subscribedAt\n" + subscribers.map((s) => `${s.email},${new Date(s.subscribedAt).toISOString()}`).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "subscribers.csv";
            a.click();
          }}
          className="px-3 py-1.5 rounded-lg border border-[var(--color-stone)]/20 font-body text-xs font-medium hover:bg-[var(--color-stone)]/10"
        >
          Eksporter CSV
        </button>
      </div>
      {subscribers.map((s) => (
        <div
          key={s._id}
          className="bg-[var(--color-cloud)] rounded-xl border border-[var(--color-stone)]/15 px-4 py-3 flex items-center justify-between"
        >
          <span className="font-body text-sm text-[var(--color-bark)]">{s.email}</span>
          <span className="font-mono text-xs text-[var(--color-stone)]">
            {new Date(s.subscribedAt).toLocaleDateString("nb-NO")}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Shared ─── */

function Loading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-[var(--color-stone)]/10 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

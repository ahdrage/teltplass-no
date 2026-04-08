"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

const ADMIN_PASSWORD = "teltplass-admin-2026";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<"submissions" | "places" | "subscribers">("submissions");

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl text-[var(--color-bark)] mb-6">Admin</h1>

      <div className="flex gap-1 mb-6 bg-[var(--color-cloud)] p-1 rounded-xl border border-[var(--color-stone)]/15 w-fit">
        {(["submissions", "places", "subscribers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-body text-sm font-medium transition-colors ${
              tab === t
                ? "bg-[var(--color-bark)] text-white"
                : "text-[var(--color-bark)] hover:bg-[var(--color-stone)]/10"
            }`}
          >
            {t === "submissions" ? "Innsendte" : t === "places" ? "Steder" : "Abonnenter"}
          </button>
        ))}
      </div>

      {tab === "submissions" && <SubmissionsTab />}
      {tab === "places" && <PlacesTab />}
      {tab === "subscribers" && <SubscribersTab />}
    </div>
  );
}

function SubmissionsTab() {
  const submissions = useQuery(api.submissions.listAll);
  const approveSubmission = useMutation(api.submissions.approve);
  const rejectSubmission = useMutation(api.submissions.reject);

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
        pending.map((sub) => (
          <div
            key={sub._id}
            className="bg-[var(--color-cloud)] rounded-xl border border-[var(--color-stone)]/15 p-4 flex items-start justify-between gap-4"
          >
            <div>
              <h3 className="font-display text-base text-[var(--color-bark)]">{sub.title}</h3>
              <p className="font-body text-sm text-[var(--color-stone)] mt-1">{sub.address}</p>
              <p className="font-body text-sm text-[var(--color-stone)] mt-1 line-clamp-2">{sub.description}</p>
              <p className="font-mono text-xs text-[var(--color-stone)] mt-2">
                {sub.photos.length} bilder &middot; {sub.amenities.join(", ") || "Ingen fasiliteter"}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
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
        ))
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

function PlacesTab() {
  const places = useQuery(api.places.list, { onlyApproved: false });
  const toggleApproved = useMutation(api.places.approve);
  const removePlace = useMutation(api.places.remove);

  if (!places) return <Loading />;

  return (
    <div className="space-y-2">
      <p className="font-mono text-xs text-[var(--color-stone)] mb-4">{places.length} steder totalt</p>
      {places.map((p) => (
        <div
          key={p._id}
          className="bg-[var(--color-cloud)] rounded-xl border border-[var(--color-stone)]/15 px-4 py-3 flex items-center justify-between gap-4"
        >
          <div className="min-w-0">
            <h3 className="font-display text-sm text-[var(--color-bark)] truncate">{p.title}</h3>
            <p className="font-mono text-xs text-[var(--color-stone)] truncate">{p.slug}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
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
      ))}
    </div>
  );
}

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

function Loading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-[var(--color-stone)]/10 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

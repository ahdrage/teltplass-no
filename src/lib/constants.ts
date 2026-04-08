export const AMENITY_CONFIG: Record<string, { label: string; icon: string }> = {
  Utedo: {
    label: "Utedo",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>`,
  },
  "Søppelkorg": {
    label: "Søppelkorg",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>`,
  },
  "Hengekøye": {
    label: "Hengekøye",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12c3-4 7-6 10-6s7 2 10 6M4 20l2-8M20 20l-2-8"/></svg>`,
  },
  Fiske: {
    label: "Fiske",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12s3-6 6-6 6 6 6 6-3 6-6 6-6-6-6-6z"/><path d="M6 12H2M12 6V2"/></svg>`,
  },
  Drikkevann: {
    label: "Drikkevann",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6l-3 4c-1.3 1.7-2 3.7-2 5.8A5.2 5.2 0 0012 23a5.2 5.2 0 005-5.2c0-2.1-.7-4.1-2-5.8L12 8"/></svg>`,
  },
  Ved: {
    label: "Bålved",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c-2 4-6 6-6 10a6 6 0 0012 0c0-4-4-6-6-10z"/><path d="M12 18v4"/></svg>`,
  },
};

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useEffect } from "react";

export default function OldPlaceRedirect() {
  const params = useParams<{ path: string[] }>();
  const oldPath = `/c/${params.path?.join("/")}`;
  const place = useQuery(api.places.getByOldPath, { oldPath });

  useEffect(() => {
    if (place === null) {
      window.location.href = "/kart";
    } else if (place) {
      window.location.href = `/teltplass/${place.slug}`;
    }
  }, [place]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="font-body text-[var(--color-stone)]">Omdirigerer...</p>
    </div>
  );
}

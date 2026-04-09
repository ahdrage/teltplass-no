"use client";

import { type ReactElement, Suspense, useEffect } from "react";
import { load, trackPageview } from "fathom-client";
import { usePathname, useSearchParams } from "next/navigation";

const FATHOM_SITE_ID =
  process.env.NEXT_PUBLIC_FATHOM_SITE_ID ?? "KNRIDKUT";

function TrackPageView(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    load(FATHOM_SITE_ID, {
      auto: false,
    });
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    trackPageview({
      url,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
    });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Client-side Fathom loader + SPA pageviews for Next.js App Router.
 * @see https://usefathom.com/docs/integrations/next
 */
export function Fathom(): ReactElement {
  return (
    <Suspense fallback={null}>
      <TrackPageView />
    </Suspense>
  );
}

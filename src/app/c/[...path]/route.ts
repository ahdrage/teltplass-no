import { NextRequest, NextResponse } from "next/server";

import { api } from "../../../../convex/_generated/api";
import { getConvexClient } from "../../../lib/convex-server";
import { buildLegacyPlacePath } from "@/lib/seo";

interface LegacyPlaceRouteContext {
  params: Promise<{ path: string[] }>;
}

async function redirectLegacyPlace(
  request: NextRequest,
  context: LegacyPlaceRouteContext,
): Promise<NextResponse> {
  const { path } = await context.params;
  const oldPath = buildLegacyPlacePath(path);
  const place = await getConvexClient().query(api.places.getByOldPath, { oldPath });

  const redirectUrl = new URL(place ? `/teltplass/${place.slug}` : "/kart", request.url);
  return NextResponse.redirect(redirectUrl, 301);
}

export async function GET(
  request: NextRequest,
  context: LegacyPlaceRouteContext,
): Promise<NextResponse> {
  return redirectLegacyPlace(request, context);
}

export async function HEAD(
  request: NextRequest,
  context: LegacyPlaceRouteContext,
): Promise<NextResponse> {
  return redirectLegacyPlace(request, context);
}

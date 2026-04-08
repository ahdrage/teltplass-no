import { NextRequest, NextResponse } from "next/server";

import { getLegacyRedirectTarget } from "./src/lib/seo";

export function middleware(request: NextRequest): NextResponse {
  const target = getLegacyRedirectTarget(request.nextUrl.pathname);
  if (!target) {
    return NextResponse.next();
  }

  const redirectUrl = new URL(target, request.url);
  redirectUrl.search = request.nextUrl.search;

  return NextResponse.redirect(redirectUrl, 301);
}

export const config = {
  matcher: ["/s", "/p/:path*", "/nettstedskart.xml"],
};

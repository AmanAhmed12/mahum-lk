import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/jwt";
import type { Role } from "@/types";

const ROLE_PREFIXES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/provider", roles: ["SERVICE_PROVIDER"] },
  { prefix: "/account", roles: ["ADMIN", "SERVICE_PROVIDER", "CUSTOMER"] },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const match = ROLE_PREFIXES.find((entry) => pathname.startsWith(entry.prefix));
  if (!match) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const payload = token ? await verifyAccessToken(token) : null;

  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!match.roles.includes(payload.role)) {
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/provider/:path*", "/account/:path*"],
};

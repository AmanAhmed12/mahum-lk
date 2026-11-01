import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/lib/api/errors";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "@/lib/auth/cookies";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/auth/jwt";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token." }, { status: 401 });
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      const response = NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
      clearAuthCookies(response.cookies);
      return response;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) {
      const response = NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
      clearAuthCookies(response.cookies);
      return response;
    }

    const matches = await verifyPassword(refreshToken, user.refreshTokenHash);
    if (!matches) {
      // Refresh token reuse/mismatch detected — revoke the session.
      await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: null } });
      const response = NextResponse.json({ error: "Session invalid. Please log in again." }, { status: 401 });
      clearAuthCookies(response.cookies);
      return response;
    }

    const newAccessToken = await signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const newRefreshToken = await signRefreshToken({ sub: user.id });
    const newRefreshTokenHash = await hashPassword(newRefreshToken);

    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: newRefreshTokenHash } });

    const response = NextResponse.json({ ok: true });
    setAuthCookies(response.cookies, { accessToken: newAccessToken, refreshToken: newRefreshToken });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/lib/api/errors";
import { clearAuthCookies, REFRESH_COOKIE } from "@/lib/auth/cookies";
import { verifyRefreshToken } from "@/lib/auth/jwt";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
      const payload = await verifyRefreshToken(refreshToken);
      if (payload) {
        await prisma.user
          .update({ where: { id: payload.sub }, data: { refreshTokenHash: null } })
          .catch(() => undefined);
      }
    }

    const response = NextResponse.json({ ok: true });
    clearAuthCookies(response.cookies);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/cookies";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validators/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    const invalidCredentialsMessage = "Invalid email or password.";

    if (!user) {
      return NextResponse.json({ error: invalidCredentialsMessage }, { status: 401 });
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: invalidCredentialsMessage }, { status: 401 });
    }

    const accessToken = await signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const refreshToken = await signRefreshToken({ sub: user.id });
    const refreshTokenHash = await hashPassword(refreshToken);

    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash } });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
    });
    setAuthCookies(response.cookies, { accessToken, refreshToken });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

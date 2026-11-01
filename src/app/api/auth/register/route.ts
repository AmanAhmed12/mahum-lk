import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/api/errors";
import { hashPassword } from "@/lib/auth/password";
import { setAuthCookies } from "@/lib/auth/cookies";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        passwordHash,
        role: "CUSTOMER",
        customerProfile: { create: {} },
      },
    });

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

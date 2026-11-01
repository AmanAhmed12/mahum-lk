import "server-only";

import { cookies } from "next/headers";

import prisma from "@/lib/prisma";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/jwt";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "SERVICE_PROVIDER" | "CUSTOMER";
  avatarUrl: string | null;
  customerProfileId: string | null;
  providerProfileId: string | null;
}

/**
 * Reads + verifies the access token cookie, then loads the full user record.
 * Returns null if there is no valid session (never throws).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyAccessToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: {
      customerProfile: { select: { id: true } },
      serviceProviderProfile: { select: { id: true } },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    customerProfileId: user.customerProfile?.id ?? null,
    providerProfileId: user.serviceProviderProfile?.id ?? null,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export class UnauthorizedError extends Error {
  constructor(message = "You must be signed in to do this.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do this.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

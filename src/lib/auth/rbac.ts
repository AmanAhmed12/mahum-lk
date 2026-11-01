import "server-only";

import type { Role } from "@/types";
import { ForbiddenError, getCurrentUser, type SessionUser, UnauthorizedError } from "@/lib/auth/session";

/**
 * Ensures the current request is authenticated and (optionally) that the
 * user's role is one of `roles`. Throws UnauthorizedError / ForbiddenError,
 * which API routes should catch via lib/api/errors.ts's handleApiError().
 */
export async function requireRole(roles?: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    throw new ForbiddenError();
  }
  return user;
}

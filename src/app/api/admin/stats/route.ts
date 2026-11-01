import { NextResponse } from "next/server";

import { getAdminStats } from "@/lib/admin/stats";
import { handleApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const stats = await getAdminStats();
    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}

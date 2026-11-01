import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { serviceSchema } from "@/lib/validators/catalogue";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
    if (includeInactive) await requireRole(["ADMIN"]);

    const services = await prisma.service.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ services });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const body = await request.json();
    const input = serviceSchema.parse(body);
    const service = await prisma.service.create({ data: input });
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/api/errors";
import { hashPassword } from "@/lib/auth/password";
import { requireRole } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { createStaffSchema } from "@/lib/validators/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const providers = await prisma.serviceProviderProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ providers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const body = await request.json();
    const input = createStaffSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        passwordHash,
        role: input.role,
        ...(input.role === "SERVICE_PROVIDER"
          ? {
              serviceProviderProfile: {
                create: {
                  specialization: input.specialization || null,
                  experienceYears: input.experienceYears ?? null,
                },
              },
            }
          : {}),
      },
      include: { serviceProviderProfile: true },
    });

    return NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

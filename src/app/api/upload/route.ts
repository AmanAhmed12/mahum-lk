import { NextResponse } from "next/server";

import { BadRequestError, handleApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, uploadBuffer, type CloudinaryFolder } from "@/lib/cloudinary";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FOLDER_ROLES: Record<CloudinaryFolder, Array<"ADMIN" | "SERVICE_PROVIDER" | "CUSTOMER">> = {
  "mahum/products": ["ADMIN"],
  "mahum/categories": ["ADMIN"],
  "mahum/avatars": ["ADMIN", "SERVICE_PROVIDER", "CUSTOMER"],
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as CloudinaryFolder) || "mahum/avatars";

    if (!(folder in FOLDER_ROLES)) {
      throw new BadRequestError("Unknown upload folder.");
    }

    const user = await requireRole(FOLDER_ROLES[folder]);

    if (!(file instanceof File)) {
      throw new BadRequestError("No file provided.");
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new BadRequestError("Only JPEG, PNG or WEBP images are allowed.");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestError("Image must be smaller than 5MB.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBuffer(buffer, folder);

    if (folder === "mahum/avatars") {
      await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: result.url } });
    }

    return NextResponse.json({ url: result.url, publicId: result.publicId });
  } catch (error) {
    return handleApiError(error);
  }
}

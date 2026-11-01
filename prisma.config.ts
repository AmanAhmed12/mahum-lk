// Prisma CLI configuration (migrations, seeding, introspection).
// The running Next.js app does NOT read this file — it builds its own
// PrismaClient with the Neon serverless adapter in src/lib/prisma.ts.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection to Neon.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});

/**
 * Seeds demo data: one account per role, a handful of categories/products
 * mirroring mahum.lk, and a few tailoring services.
 *
 * Run with: npm run db:seed
 */
import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import ws from "ws";

import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL (or DIRECT_URL) is not set. Fill in .env first.");
}

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("Seeding Mahum.lk demo data...");

  // --- Users (one per role) ---------------------------------------------
  const adminPassword = await hash("Admin@12345");
  const admin = await prisma.user.upsert({
    where: { email: "admin@mahum.lk" },
    update: {},
    create: {
      name: "Store Admin",
      email: "admin@mahum.lk",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const providerPassword = await hash("Provider@12345");
  const providerUser = await prisma.user.upsert({
    where: { email: "provider@mahum.lk" },
    update: {},
    create: {
      name: "Nimal Perera",
      email: "provider@mahum.lk",
      passwordHash: providerPassword,
      role: "SERVICE_PROVIDER",
      serviceProviderProfile: {
        create: { specialization: "Men's formal wear", experienceYears: 8 },
      },
    },
    include: { serviceProviderProfile: true },
  });

  const customerPassword = await hash("Customer@12345");
  const customerUser = await prisma.user.upsert({
    where: { email: "customer@mahum.lk" },
    update: {},
    create: {
      name: "Amaya Fernando",
      email: "customer@mahum.lk",
      passwordHash: customerPassword,
      role: "CUSTOMER",
      phone: "+94771234567",
      customerProfile: { create: { address: "12 Lotus Road", city: "Colombo" } },
    },
    include: { customerProfile: true },
  });

  console.log("Users ready:", { admin: admin.email, provider: providerUser.email, customer: customerUser.email });

  // --- Categories ----------------------------------------------------------
  const categoryDefs = [
    { name: "Buttons", slug: "buttons" },
    { name: "Threads", slug: "threads" },
    { name: "Sewing Supplies", slug: "sewing-supplies" },
    { name: "Cutting & Measuring", slug: "cutting-measuring" },
    { name: "Garment Construction", slug: "garment-construction" },
    { name: "Crafts & Hobbies", slug: "crafts-hobbies" },
    { name: "Zippers", slug: "zippers" },
    { name: "Beads", slug: "beads" },
  ];

  const categories = await Promise.all(
    categoryDefs.map((def) =>
      prisma.category.upsert({ where: { slug: def.slug }, update: {}, create: def }),
    ),
  );

  // --- Products --------------------------------------------------------------
  const productDefs = [
    {
      name: "Assorted Pearl Buttons (Pack of 50)",
      slug: "assorted-pearl-buttons-pack-50",
      description: "A mixed pack of pearl-finish buttons in multiple sizes, ideal for shirts and blouses.",
      sku: "BTN-001",
      price: 850,
      discountPrice: 699,
      categorySlug: "buttons",
      quantity: 120,
    },
    {
      name: "Polyester Sewing Thread Set (12 Colours)",
      slug: "polyester-thread-set-12-colours",
      description: "High-strength polyester thread set, 12 vibrant colours, 200m per spool.",
      sku: "THR-010",
      price: 1450,
      discountPrice: null,
      categorySlug: "threads",
      quantity: 60,
    },
    {
      name: "Tailor's Measuring Tape (150cm)",
      slug: "tailors-measuring-tape-150cm",
      description: "Durable fibreglass measuring tape with both cm and inch markings.",
      sku: "MSR-004",
      price: 390,
      discountPrice: null,
      categorySlug: "cutting-measuring",
      quantity: 200,
    },
    {
      name: "Fabric Scissors — Professional Grade",
      slug: "fabric-scissors-professional-grade",
      description: "Sharp, ergonomic stainless-steel scissors built for precision fabric cutting.",
      sku: "CUT-002",
      price: 2200,
      discountPrice: 1890,
      categorySlug: "cutting-measuring",
      quantity: 35,
    },
    {
      name: "Invisible Zipper — 20cm (Assorted Colours)",
      slug: "invisible-zipper-20cm-assorted",
      description: "Smooth-gliding invisible zippers for dresses and skirts, assorted colours.",
      sku: "ZIP-007",
      price: 180,
      discountPrice: null,
      categorySlug: "zippers",
      quantity: 300,
    },
    {
      name: "Glass Seed Beads (500g Jar)",
      slug: "glass-seed-beads-500g-jar",
      description: "Fine glass seed beads for embroidery and jewellery-making, mixed colours.",
      sku: "BED-003",
      price: 1100,
      discountPrice: 950,
      categorySlug: "beads",
      quantity: 45,
    },
  ];

  for (const def of productDefs) {
    const category = categories.find((c) => c.slug === def.categorySlug)!;
    const product = await prisma.product.upsert({
      where: { slug: def.slug },
      update: {},
      create: {
        name: def.name,
        slug: def.slug,
        description: def.description,
        sku: def.sku,
        price: def.price,
        discountPrice: def.discountPrice,
        categoryId: category.id,
        isActive: true,
      },
    });

    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {},
      create: { productId: product.id, quantity: def.quantity, reorderLevel: 10 },
    });
  }

  // --- Tailoring services ------------------------------------------------
  const serviceDefs = [
    {
      name: "Shirt Stitching",
      description: "Custom-fit shirt stitched to your exact measurements.",
      basePrice: 3500,
    },
    {
      name: "Trouser Alteration",
      description: "Hem, waist and length adjustments for an existing pair of trousers.",
      basePrice: 1200,
    },
    {
      name: "Full Suit Tailoring",
      description: "A complete two-piece suit, custom-made from your chosen fabric.",
      basePrice: 18000,
    },
  ];

  for (const def of serviceDefs) {
    const existing = await prisma.service.findFirst({ where: { name: def.name } });
    if (!existing) {
      await prisma.service.create({ data: { ...def, isActive: true } });
    }
  }

  console.log(`Seeded ${categories.length} categories, ${productDefs.length} products, ${serviceDefs.length} services.`);
  console.log("\nDemo logins:");
  console.log("  Admin:    admin@mahum.lk    / Admin@12345");
  console.log("  Provider: provider@mahum.lk / Provider@12345");
  console.log("  Customer: customer@mahum.lk / Customer@12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

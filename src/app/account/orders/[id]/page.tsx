import { notFound, redirect } from "next/navigation";

import { OrderDetail } from "@/components/order/order-detail";
import { getCurrentUser } from "@/lib/auth/session";
import { toOrderDetailData } from "@/lib/mappers/order";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ORDER_INCLUDE = {
  items: { include: { product: { include: { images: true } }, service: true, measurement: true } },
  payment: true,
  delivery: true,
  customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
  provider: { include: { user: { select: { name: true, email: true } } } },
} as const;

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerOrderDetailPage({ params }: OrderPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/account/orders");
  if (!user.customerProfileId) redirect("/");

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });

  if (!order || order.customerId !== user.customerProfileId) notFound();

  return <OrderDetail order={toOrderDetailData(order)} showProvider />;
}

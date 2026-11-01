import { notFound, redirect } from "next/navigation";

import { AssignProvider } from "@/components/order/assign-provider";
import { OrderDetail } from "@/components/order/order-detail";
import { OrderStatusControls } from "@/components/order/order-status-controls";
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

export default async function AdminOrderDetailPage({ params }: OrderPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/admin/orders");
  if (user.role !== "ADMIN") redirect("/");

  const { id } = await params;

  const [order, providers] = await Promise.all([
    prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE }),
    prisma.serviceProviderProfile.findMany({ include: { user: { select: { name: true } } } }),
  ]);

  if (!order) notFound();

  const data = toOrderDetailData(order);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <OrderDetail order={data} showCustomer showProvider />
      <div className="space-y-6">
        <AssignProvider orderId={order.id} providers={providers} currentProviderId={order.providerId} />
        <OrderStatusControls
          orderId={order.id}
          initialStatus={data.status}
          initialDeliveryStatus={data.delivery?.status}
          initialPaymentStatus={data.payment?.status}
          initialTrackingNumber={data.delivery?.trackingNumber}
        />
      </div>
    </div>
  );
}

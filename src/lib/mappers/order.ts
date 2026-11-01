import type { OrderDetailData } from "@/components/order/order-detail";

/**
 * Converts a Prisma Order (with its Decimal fields and nested relations
 * from the shared ORDER_INCLUDE) into the plain-number shape OrderDetail expects.
 */
export function toOrderDetailData(order: {
  id: string;
  type: string;
  status: string;
  totalAmount: { toString(): string };
  notes: string | null;
  createdAt: Date;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: { toString(): string };
    product: { name: string; images: { url: string }[] } | null;
    service: { name: string } | null;
    measurement: { label: string } | null;
  }>;
  payment: {
    amount: { toString(): string };
    method: string;
    status: string;
    transactionRef: string | null;
  } | null;
  delivery: {
    address: string;
    city: string;
    method: string;
    status: string;
    trackingNumber: string | null;
  } | null;
  customer: { user: { name: string; email: string; phone: string | null } } | null;
  provider: { user: { name: string; email: string } } | null;
}): OrderDetailData {
  return {
    id: order.id,
    type: order.type,
    status: order.status,
    totalAmount: Number(order.totalAmount.toString()),
    notes: order.notes,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice.toString()),
      product: item.product,
      service: item.service,
      measurement: item.measurement,
    })),
    payment: order.payment
      ? {
          amount: Number(order.payment.amount.toString()),
          method: order.payment.method,
          status: order.payment.status,
          transactionRef: order.payment.transactionRef,
        }
      : null,
    delivery: order.delivery,
    customer: order.customer,
    provider: order.provider,
  };
}

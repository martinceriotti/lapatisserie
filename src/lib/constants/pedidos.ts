export const ORDER_STATUSES = [
  "borrador", "presupuestado", "confirmado", "en_produccion",
  "listo", "entregado", "pagado", "cancelado",
] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const PAYMENT_STATUSES = ["pending", "partial", "paid"] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  borrador: "Borrador",
  presupuestado: "Presupuestado",
  confirmado: "Confirmado",
  en_produccion: "En producción",
  listo: "Listo",
  entregado: "Entregado",
  pagado: "Pagado",
  cancelado: "Cancelado",
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Sin cobrar",
  partial: "Seña cobrada",
  paid: "Pagado",
};

// Subtotal de un ítem en pesos enteros. Es la única fuente de verdad: pantalla,
// PDF y total del pedido usan esta cuenta para que siempre coincidan.
// (El precio unitario puede tener centavos, ej. $26.000 / 30 = $866,67.)
export function itemSubtotal(item: { quantity: number | string; unit_price: number | string }) {
  return Math.round(Number(item.quantity) * Number(item.unit_price));
}

export const STATUS_FLOW: OrderStatus[] = [
  "borrador", "presupuestado", "confirmado", "en_produccion", "listo", "entregado", "pagado",
];

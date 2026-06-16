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

export const STATUS_FLOW: OrderStatus[] = [
  "borrador", "presupuestado", "confirmado", "en_produccion", "listo", "entregado", "pagado",
];

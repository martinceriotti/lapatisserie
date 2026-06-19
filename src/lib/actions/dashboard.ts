"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type DashboardOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number | null;
  deposit_amount: number | null;
  delivery_date: string | null;
  customer_name: string | null;
};

export type DashboardData = {
  por_cobrar: number;
  cobrado: number;
  pedidos_activos: number;
  por_status: Record<string, number>;
  entregas: DashboardOrder[];
  // Only populated for current month
  vencidas_sin_cobrar: DashboardOrder[];
};

const ACTIVE_STATUSES = ["borrador", "presupuestado", "confirmado", "en_produccion", "listo"];

export async function getDashboardData(year: number, month: number): Promise<DashboardData> {
  const supabase = createAdminClient();

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const monthStart = new Date(year, month - 1, 1).toISOString().split("T")[0];
  const monthEnd = new Date(year, month, 0).toISOString().split("T")[0];

  const monthQuery = supabase
    .from("orders")
    .select(
      "id, order_number, status, payment_status, total, deposit_amount, delivery_date, customer:customers(name)"
    )
    .neq("status", "cancelado")
    .gte("delivery_date", monthStart)
    .lte("delivery_date", monthEnd)
    .order("delivery_date", { ascending: true });

  const overdueQuery = isCurrentMonth
    ? supabase
        .from("orders")
        .select(
          "id, order_number, status, payment_status, total, deposit_amount, delivery_date, customer:customers(name)"
        )
        .neq("status", "cancelado")
        .neq("payment_status", "paid")
        .not("delivery_date", "is", null)
        .lt("delivery_date", today)
        .order("delivery_date", { ascending: true })
    : null;

  const [{ data: monthOrders }, overdueResult] = await Promise.all([
    monthQuery,
    overdueQuery ?? Promise.resolve({ data: [] }),
  ]);
  const overdueOrders = overdueResult?.data ?? [];

  const monthRows = (monthOrders ?? []) as any[];
  const overdueRows = overdueOrders as any[];

  let por_cobrar = 0;
  let cobrado = 0;
  const por_status: Record<string, number> = {};

  for (const o of monthRows) {
    const total = Number(o.total ?? 0);
    const deposit = Number(o.deposit_amount ?? 0);

    por_status[o.status] = (por_status[o.status] ?? 0) + 1;

    if (o.payment_status === "paid") {
      cobrado += total;
    } else if (o.payment_status === "partial") {
      cobrado += deposit;
      por_cobrar += Math.max(0, total - deposit);
    } else {
      por_cobrar += total;
    }
  }

  const toOrder = (o: any): DashboardOrder => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    payment_status: o.payment_status,
    total: o.total != null ? Number(o.total) : null,
    deposit_amount: o.deposit_amount != null ? Number(o.deposit_amount) : null,
    delivery_date: o.delivery_date,
    customer_name: o.customer?.name ?? null,
  });

  // For current month: only show upcoming (>= today). For past months: show all.
  const entregas = isCurrentMonth
    ? monthRows
        .filter((o) => o.delivery_date && o.delivery_date >= today && ACTIVE_STATUSES.includes(o.status))
        .slice(0, 8)
        .map(toOrder)
    : monthRows.slice(0, 8).map(toOrder);

  const pedidos_activos = monthRows.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;

  return {
    por_cobrar,
    cobrado,
    pedidos_activos,
    por_status,
    entregas,
    vencidas_sin_cobrar: overdueRows.map(toOrder),
  };
}

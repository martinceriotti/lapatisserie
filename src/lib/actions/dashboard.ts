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
  // KPIs — scoped to current month's deliveries
  por_cobrar: number;
  cobrado: number;
  pedidos_activos: number;
  // Status breakdown for current month
  por_status: Record<string, number>;
  // Upcoming deliveries this month (delivery_date >= today)
  proximas_entregas: DashboardOrder[];
  // Overdue: delivery_date < today, not fully paid, not cancelled
  vencidas_sin_cobrar: DashboardOrder[];
};

const ACTIVE_STATUSES = ["borrador", "presupuestado", "confirmado", "en_produccion", "listo"];

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createAdminClient();

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [{ data: monthOrders }, { data: overdueOrders }] = await Promise.all([
    // Orders with delivery date this month
    supabase
      .from("orders")
      .select(
        "id, order_number, status, payment_status, total, deposit_amount, delivery_date, customer:customers(name)"
      )
      .neq("status", "cancelado")
      .gte("delivery_date", monthStart)
      .lte("delivery_date", monthEnd)
      .order("delivery_date", { ascending: true }),

    // Past-due orders: delivery already happened, not fully paid
    supabase
      .from("orders")
      .select(
        "id, order_number, status, payment_status, total, deposit_amount, delivery_date, customer:customers(name)"
      )
      .neq("status", "cancelado")
      .neq("payment_status", "paid")
      .not("delivery_date", "is", null)
      .lt("delivery_date", today)
      .order("delivery_date", { ascending: true }),
  ]);

  const monthRows = (monthOrders ?? []) as any[];
  const overdueRows = (overdueOrders ?? []) as any[];

  // KPI aggregation from this month's orders
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

  const proximas_entregas = monthRows
    .filter((o) => o.delivery_date && o.delivery_date >= today && ACTIVE_STATUSES.includes(o.status))
    .slice(0, 6)
    .map(toOrder);

  const pedidos_activos = monthRows.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;

  const vencidas_sin_cobrar = overdueRows.map(toOrder);

  return {
    por_cobrar,
    cobrado,
    pedidos_activos,
    por_status,
    proximas_entregas,
    vencidas_sin_cobrar,
  };
}

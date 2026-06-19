import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDashboardData, getDashboardChartData } from "@/lib/actions/dashboard";
import { DashboardChart } from "@/components/admin/dashboard/DashboardChart";
import {
  STATUS_LABELS,
  PAYMENT_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants/pedidos";
import { type DashboardOrder } from "@/lib/actions/dashboard";

export const metadata = { title: "Dashboard | Admin" };

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  borrador: "bg-muted text-muted-foreground",
  presupuestado: "bg-blue-100 text-blue-700",
  confirmado: "bg-indigo-100 text-indigo-700",
  en_produccion: "bg-amber-100 text-amber-700",
  listo: "bg-orange-100 text-orange-700",
  entregado: "bg-teal-100 text-teal-700",
  pagado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  pending: "bg-red-100 text-red-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
};

const STATUS_ORDER: OrderStatus[] = [
  "borrador", "presupuestado", "confirmado", "en_produccion", "listo", "entregado", "pagado",
];

function monthHref(year: number, month: number) {
  return `/admin?month=${year}-${String(month).padStart(2, "0")}`;
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", weekday: "short" });
}

function daysUntil(dateStr: string): { label: string; urgent: boolean } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return { label: "hoy", urgent: true };
  if (diff === 1) return { label: "mañana", urgent: true };
  if (diff <= 3) return { label: `en ${diff} días`, urgent: true };
  if (diff <= 7) return { label: `en ${diff} días`, urgent: false };
  return null;
}

function remaining(o: DashboardOrder) {
  if (o.payment_status === "paid") return 0;
  if (o.payment_status === "partial") return Math.max(0, (o.total ?? 0) - (o.deposit_amount ?? 0));
  return o.total ?? 0;
}

function OrderTable({
  orders,
  showOverdue,
  isPast,
}: {
  orders: DashboardOrder[];
  showOverdue?: boolean;
  isPast?: boolean;
}) {
  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border">
        {orders.map((o) => {
          const rem = remaining(o);
          const urgency = o.delivery_date && !isPast && !showOverdue ? daysUntil(o.delivery_date) : null;
          return (
            <Link
              key={o.id}
              href={`/admin/pedidos/${o.id}`}
              className="block px-4 py-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {o.customer_name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    #{o.order_number}
                    {urgency && (
                      <span className={`ml-2 font-semibold ${urgency.urgent ? "text-red-600" : "text-primary"}`}>
                        {urgency.label}
                      </span>
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {rem > 0 ? (
                    <p className="text-sm font-semibold text-red-600">{ARS.format(rem)}</p>
                  ) : (
                    <p className="text-sm font-semibold text-green-600">Cobrado</p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status as OrderStatus]}`}>
                  {STATUS_LABELS[o.status as OrderStatus] ?? o.status}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[o.payment_status as PaymentStatus]}`}>
                  {PAYMENT_LABELS[o.payment_status as PaymentStatus] ?? o.payment_status}
                </span>
                {o.delivery_date && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDate(o.delivery_date)}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {showOverdue ? "Entregó" : "Entrega"}
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cliente
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Estado
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pago
              </th>
              <th className="text-right px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total
              </th>
              <th className="text-right px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Resta cobrar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => {
              const rem = remaining(o);
              const urgency = o.delivery_date && !isPast && !showOverdue ? daysUntil(o.delivery_date) : null;
              return (
                <tr
                  key={o.id}
                  className={`hover:bg-accent/40 transition-colors ${showOverdue ? "bg-red-50/40" : ""}`}
                >
                  <td className="px-5 py-3 font-medium whitespace-nowrap">
                    <Link href={`/admin/pedidos/${o.id}`} className="hover:text-primary">
                      {o.delivery_date ? formatDate(o.delivery_date) : "—"}
                      {urgency && (
                        <span className={`ml-2 text-xs font-semibold ${urgency.urgent ? "text-red-600" : "text-primary"}`}>
                          {urgency.label}
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    <Link href={`/admin/pedidos/${o.id}`} className="hover:text-primary">
                      {o.customer_name ?? "—"}
                      <span className="ml-1.5 text-xs text-muted-foreground">#{o.order_number}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status as OrderStatus]}`}>
                      {STATUS_LABELS[o.status as OrderStatus] ?? o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[o.payment_status as PaymentStatus]}`}>
                      {PAYMENT_LABELS[o.payment_status as PaymentStatus] ?? o.payment_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-foreground font-medium">
                    {o.total != null ? ARS.format(o.total) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {rem > 0 ? (
                      <span className="font-semibold text-red-600">{ARS.format(rem)}</span>
                    ) : (
                      <span className="text-green-600 font-semibold">Cobrado</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  if (params.month && /^\d{4}-\d{2}$/.test(params.month)) {
    const [y, m] = params.month.split("-").map(Number);
    if (m >= 1 && m <= 12) {
      year = y;
      month = m;
    }
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const isPast = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const monthLabel = MONTHS_ES[month - 1];

  const [data, chartData] = await Promise.all([
    getDashboardData(year, month),
    getDashboardChartData(),
  ]);

  const entregasLabel = isPast
    ? `Entregas — ${monthLabel}`
    : `Próximas entregas — ${monthLabel}`;

  const emptyLabel = isPast
    ? "No hubo entregas ese mes."
    : "No hay entregas pendientes este mes.";

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header with month nav */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-2xl md:text-3xl text-foreground">Dashboard</h1>
          <div className="flex items-center gap-1 mt-0.5">
            <Link
              href={monthHref(prev.year, prev.month)}
              className="p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm text-muted-foreground capitalize min-w-[130px] text-center">
              {monthLabel} {year}
            </span>
            {isCurrentMonth ? (
              <span className="p-0.5 text-muted-foreground/30 cursor-default">
                <ChevronRight className="w-4 h-4" />
              </span>
            ) : (
              <Link
                href={isCurrentMonth ? "#" : monthHref(next.year, next.month)}
                className="p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
            {!isCurrentMonth && (
              <Link
                href="/admin"
                className="ml-2 text-xs text-primary hover:underline"
              >
                Hoy
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Trend chart — always shows last 12 months regardless of selected month */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Evolución — últimos 12 meses
        </p>
        <DashboardChart data={chartData} />
      </div>

      {/* Alert: overdue unpaid — only current month */}
      {isCurrentMonth && data.vencidas_sin_cobrar.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-red-200 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <p className="text-sm font-semibold text-red-800">
              {data.vencidas_sin_cobrar.length === 1
                ? "1 pedido entregado sin cobrar"
                : `${data.vencidas_sin_cobrar.length} pedidos entregados sin cobrar`}
            </p>
          </div>
          <OrderTable orders={data.vencidas_sin_cobrar} showOverdue />
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Por cobrar — {monthLabel}
          </p>
          <p className="font-heading text-2xl text-foreground mt-1">
            {ARS.format(data.por_cobrar)}
          </p>
          <p className="text-xs text-muted-foreground">Saldo pendiente de entregas del mes</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Cobrado — {monthLabel}
          </p>
          <p className="font-heading text-2xl text-foreground mt-1">
            {ARS.format(data.cobrado)}
          </p>
          <p className="text-xs text-muted-foreground">Señas + pagos completos del mes</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {isPast ? "Total pedidos" : "Pedidos activos"} — {monthLabel}
          </p>
          <p className="font-heading text-2xl text-foreground mt-1">
            {data.pedidos_activos}
          </p>
          <p className="text-xs text-muted-foreground">
            {isPast ? "Pedidos con entrega ese mes" : "Con entrega pendiente este mes"}
          </p>
        </div>
      </div>

      {/* Status breakdown */}
      {Object.keys(data.por_status).length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Estados del mes
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_ORDER.map((s) => {
              const count = data.por_status[s];
              if (!count) return null;
              return (
                <Link
                  key={s}
                  href={`/admin/pedidos?status=${s}`}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 ${STATUS_COLORS[s]}`}
                >
                  {STATUS_LABELS[s]}
                  <span className="font-bold">{count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Deliveries table */}
      {data.entregas.length > 0 ? (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {entregasLabel}
            </p>
            <Link href="/admin/pedidos" className="text-xs text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <OrderTable orders={data.entregas} isPast={isPast} />
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm mb-6">
          {emptyLabel}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/pedidos", label: "Pedidos" },
          { href: "/admin/produccion", label: "Producción" },
          { href: "/admin/materias-primas", label: "Materias Primas" },
          { href: "/admin/recetas", label: "Recetas" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center justify-center px-3 py-3 bg-surface border border-border rounded-xl text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all duration-150 text-center"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

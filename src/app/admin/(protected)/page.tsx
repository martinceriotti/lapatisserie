import Link from "next/link";
import { getDashboardData } from "@/lib/actions/dashboard";
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
  "borrador", "presupuestado", "confirmado", "en_produccion", "listo", "entregado",
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", weekday: "short" });
}

function daysUntil(dateStr: string) {
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

function OrderTable({ orders, showOverdue }: { orders: DashboardOrder[]; showOverdue?: boolean }) {
  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border">
        {orders.map((o) => {
          const rem = remaining(o);
          const urgency = o.delivery_date ? daysUntil(o.delivery_date) : null;
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
                    {showOverdue && o.delivery_date && (
                      <span className="ml-2 text-red-600 font-semibold">
                        Entregó {formatDate(o.delivery_date)}
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
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status as OrderStatus]}`}>
                  {STATUS_LABELS[o.status as OrderStatus] ?? o.status}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[o.payment_status as PaymentStatus]}`}>
                  {PAYMENT_LABELS[o.payment_status as PaymentStatus] ?? o.payment_status}
                </span>
                {!showOverdue && o.delivery_date && (
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
              const urgency = o.delivery_date && !showOverdue ? daysUntil(o.delivery_date) : null;
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

export default async function AdminDashboard() {
  const data = await getDashboardData();
  const now = new Date();
  const monthLabel = MONTHS_ES[now.getMonth()];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5 capitalize">
          {monthLabel} {now.getFullYear()}
        </p>
      </div>

      {/* Alert: overdue unpaid */}
      {data.vencidas_sin_cobrar.length > 0 && (
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
            Pedidos activos — {monthLabel}
          </p>
          <p className="font-heading text-2xl text-foreground mt-1">
            {data.pedidos_activos}
          </p>
          <p className="text-xs text-muted-foreground">Con entrega pendiente este mes</p>
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

      {/* Upcoming deliveries this month */}
      {data.proximas_entregas.length > 0 ? (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Próximas entregas — {monthLabel}
            </p>
            <Link href="/admin/pedidos" className="text-xs text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <OrderTable orders={data.proximas_entregas} />
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm mb-6">
          No hay entregas pendientes este mes.
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

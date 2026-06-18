"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, Calendar, List } from "lucide-react";
import { type OrderSummary } from "@/lib/actions/pedidos";
import {
  type OrderStatus,
  STATUS_LABELS,
  PAYMENT_LABELS,
} from "@/lib/constants/pedidos";
import { cn } from "@/lib/utils";

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

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

const STATUS_DOT: Record<OrderStatus, string> = {
  borrador: "bg-muted-foreground/40",
  presupuestado: "bg-blue-400",
  confirmado: "bg-indigo-400",
  en_produccion: "bg-amber-400",
  listo: "bg-orange-400",
  entregado: "bg-teal-400",
  pagado: "bg-green-400",
  cancelado: "bg-red-400",
};

const TABS = [
  { key: "activos", label: "Activos", statuses: ["borrador", "presupuestado", "confirmado", "en_produccion", "listo"] },
  { key: "entregados", label: "Entregados", statuses: ["entregado", "pagado"] },
  { key: "cancelados", label: "Cancelados", statuses: ["cancelado"] },
  { key: "todos", label: "Todos", statuses: [] },
] as const;

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  });
}

// ── Calendar View ──────────────────────────────────────────────────────────────

function CalendarView({ orders, onSelectOrder }: { orders: OrderSummary[]; onSelectOrder: (id: string) => void }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday-first: 0=Mon … 6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = startOffset + lastDay.getDate();
  const weeks = Math.ceil(totalCells / 7);

  // Map delivery_date → orders
  const ordersByDate = new Map<string, OrderSummary[]>();
  for (const o of orders) {
    if (!o.delivery_date) continue;
    const key = o.delivery_date;
    if (!ordersByDate.has(key)) ordersByDate.set(key, []);
    ordersByDate.get(key)!.push(o);
  }

  const todayStr = today.toISOString().split("T")[0];

  function dayKey(d: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const selectedOrders = selectedDay ? (ordersByDate.get(selectedDay) ?? []) : [];

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold">{MONTHS_ES[month]} {year}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Grid */}
      <div className="border border-border rounded-2xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {DAYS_ES.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {Array.from({ length: weeks }).map((_, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-border border-b border-border last:border-b-0">
            {Array.from({ length: 7 }).map((_, di) => {
              const cellIdx = wi * 7 + di;
              const dayNum = cellIdx - startOffset + 1;
              const isValid = dayNum >= 1 && dayNum <= lastDay.getDate();
              const key = isValid ? dayKey(dayNum) : null;
              const dayOrders = key ? (ordersByDate.get(key) ?? []) : [];
              const isToday = key === todayStr;
              const isSelected = key === selectedDay;

              return (
                <div
                  key={di}
                  onClick={() => isValid && key && setSelectedDay(isSelected ? null : key)}
                  className={cn(
                    "min-h-[72px] p-1.5 transition-colors",
                    isValid ? "cursor-pointer hover:bg-muted/20" : "bg-muted/5",
                    isSelected && "bg-primary/5",
                    !isValid && "opacity-30",
                  )}
                >
                  {isValid && (
                    <>
                      <span className={cn(
                        "inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1",
                        isToday ? "bg-primary text-white" : "text-foreground",
                      )}>
                        {dayNum}
                      </span>
                      <div className="space-y-0.5">
                        {dayOrders.slice(0, 3).map((o) => (
                          <div
                            key={o.id}
                            onClick={(e) => { e.stopPropagation(); onSelectOrder(o.id); }}
                            className={cn(
                              "text-[10px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80",
                              STATUS_COLORS[o.status],
                            )}
                            title={`${o.customer?.name} — ${STATUS_LABELS[o.status]}`}
                          >
                            {o.customer?.name ?? o.order_number}
                          </div>
                        ))}
                        {dayOrders.length > 3 && (
                          <div className="text-[10px] text-muted-foreground px-1">
                            +{dayOrders.length - 3} más
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border">
            <span className="text-sm font-medium">
              {new Date(selectedDay + "T00:00:00").toLocaleDateString("es-AR", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </span>
            <span className="text-muted-foreground text-sm ml-2">
              — {selectedOrders.length} {selectedOrders.length === 1 ? "pedido" : "pedidos"}
            </span>
          </div>
          {selectedOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">Sin pedidos este día.</p>
          ) : (
            <div className="divide-y divide-border">
              {selectedOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 cursor-pointer"
                  onClick={() => onSelectOrder(o.id)}
                >
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", STATUS_COLORS[o.status])}>
                    {STATUS_LABELS[o.status]}
                  </span>
                  <span className="font-medium text-sm">{o.customer?.name ?? "—"}</span>
                  <span className="text-xs text-muted-foreground font-mono">{o.order_number}</span>
                  <span className="ml-auto font-mono text-sm font-semibold">
                    {o.total != null ? ARS.format(o.total) : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── List View ──────────────────────────────────────────────────────────────────

function ListView({ orders }: { orders: OrderSummary[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"activos" | "entregados" | "cancelados" | "todos">("activos");

  const filtered = orders.filter((o) => {
    const t = TABS.find((t) => t.key === tab)!;
    if (t.statuses.length === 0) return true;
    return (t.statuses as readonly string[]).includes(o.status);
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-fit">
        {TABS.map((t) => {
          const count = t.statuses.length === 0
            ? orders.length
            : orders.filter((o) => (t.statuses as readonly string[]).includes(o.status)).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              <span className={cn("ml-1.5 text-xs", tab === t.key ? "text-primary" : "text-muted-foreground")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground text-sm">Sin pedidos en esta categoría.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="px-4 py-3 hover:bg-muted/20 cursor-pointer active:bg-muted/30"
                onClick={() => router.push(`/admin/pedidos/${order.id}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="font-medium text-sm">{order.customer?.name ?? "—"}</span>
                    <span className="ml-2 text-xs text-muted-foreground font-mono">{order.order_number}</span>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", STATUS_COLORS[order.status])}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {order.delivery_date ? `Entrega: ${formatDate(order.delivery_date)}` : "Sin fecha"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      order.payment_status === "paid" && "bg-green-100 text-green-700",
                      order.payment_status === "partial" && "bg-amber-100 text-amber-700",
                      order.payment_status === "pending" && "bg-muted text-muted-foreground",
                    )}>
                      {PAYMENT_LABELS[order.payment_status]}
                    </span>
                    <span className="font-mono font-semibold text-sm">
                      {order.total != null ? ARS.format(order.total) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">N°</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entrega</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ítems</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Pago</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/pedidos/${order.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{order.order_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{order.customer?.name ?? "—"}</div>
                      {order.customer?.phone && (
                        <div className="text-xs text-muted-foreground">{order.customer.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(order.delivery_date)}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{order.item_count}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {order.total != null ? ARS.format(order.total) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        order.payment_status === "paid" && "bg-green-100 text-green-700",
                        order.payment_status === "partial" && "bg-amber-100 text-amber-700",
                        order.payment_status === "pending" && "bg-muted text-muted-foreground",
                      )}>
                        {PAYMENT_LABELS[order.payment_status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[order.status])}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function PedidosList({ initialData }: { initialData: OrderSummary[] }) {
  const router = useRouter();
  const [view, setView] = useState<"lista" | "calendario">("lista");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {/* View toggle */}
        <div className="flex gap-1 bg-muted/40 p-1 rounded-xl">
          <button
            onClick={() => setView("lista")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              view === "lista" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-3.5 h-3.5" />
            Lista
          </button>
          <button
            onClick={() => setView("calendario")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              view === "calendario" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            Calendario
          </button>
        </div>

        <Button
          onClick={() => router.push("/admin/pedidos/nuevo")}
          className="gradient-brand text-white border-0 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Nuevo pedido
        </Button>
      </div>

      {view === "lista" ? (
        <ListView orders={initialData} />
      ) : (
        <CalendarView
          orders={initialData}
          onSelectOrder={(id) => router.push(`/admin/pedidos/${id}`)}
        />
      )}
    </div>
  );
}

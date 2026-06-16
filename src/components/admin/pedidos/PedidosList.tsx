"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import {
  type OrderSummary,
  type OrderStatus,
  STATUS_LABELS,
  PAYMENT_LABELS,
  STATUS_FLOW,
} from "@/lib/actions/pedidos";
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

const TABS = [
  { key: "activos", label: "Activos", statuses: ["borrador", "presupuestado", "confirmado", "en_produccion", "listo"] },
  { key: "entregados", label: "Entregados", statuses: ["entregado", "pagado"] },
  { key: "cancelados", label: "Cancelados", statuses: ["cancelado"] },
  { key: "todos", label: "Todos", statuses: [] },
] as const;

function formatDate(d: string | null) {
  if (!d) return "—";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function PedidosList({ initialData }: { initialData: OrderSummary[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"activos" | "entregados" | "cancelados" | "todos">("activos");

  const filtered = initialData.filter((o) => {
    const t = TABS.find((t) => t.key === tab)!;
    if (t.statuses.length === 0) return true;
    return (t.statuses as readonly string[]).includes(o.status);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {/* Tabs */}
        <div className="flex gap-1 bg-muted/40 p-1 rounded-xl">
          {TABS.map((t) => {
            const count = t.statuses.length === 0
              ? initialData.length
              : initialData.filter((o) => (t.statuses as readonly string[]).includes(o.status)).length;
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
                <span className={cn(
                  "ml-1.5 text-xs",
                  tab === t.key ? "text-primary" : "text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          onClick={() => router.push("/admin/pedidos/nuevo")}
          className="gradient-brand text-white border-0 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Nuevo pedido
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground text-sm">Sin pedidos en esta categoría.</p>
        </div>
      ) : (
        <div className="border border-border rounded-2xl overflow-hidden">
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
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {order.order_number}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.customer?.name ?? "—"}</div>
                    {order.customer?.phone && (
                      <div className="text-xs text-muted-foreground">{order.customer.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(order.delivery_date)}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {order.item_count}
                  </td>
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
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      STATUS_COLORS[order.status]
                    )}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

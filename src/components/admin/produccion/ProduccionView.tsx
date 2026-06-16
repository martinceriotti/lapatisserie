"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type ProductionPlan } from "@/lib/actions/produccion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, Package, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

function formatQty(qty: number, unit: string): string {
  if (unit === "g") {
    return qty >= 1000 ? `${(qty / 1000).toFixed(2).replace(/\.?0+$/, "")} kg` : `${Math.round(qty)} g`;
  }
  if (unit === "ml") {
    return qty >= 1000 ? `${(qty / 1000).toFixed(2).replace(/\.?0+$/, "")} l` : `${Math.round(qty)} ml`;
  }
  return `${qty % 1 === 0 ? qty : qty.toFixed(2)} ${unit}`;
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function DateRangeForm({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);

  function apply() {
    startTransition(() => {
      router.push(`/admin/produccion?from=${f}&to=${t}`);
    });
  }

  function setPreset(days: number) {
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + days - 1);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    setF(fmt(today));
    setT(fmt(end));
    startTransition(() => {
      router.push(`/admin/produccion?from=${fmt(today)}&to=${fmt(end)}`);
    });
  }

  return (
    <div className="border border-border rounded-2xl p-4 flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Desde</Label>
        <Input type="date" value={f} onChange={(e) => setF(e.target.value)} className="w-36" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Hasta</Label>
        <Input type="date" value={t} onChange={(e) => setT(e.target.value)} className="w-36" />
      </div>
      <Button onClick={apply} disabled={isPending} variant="outline" size="sm">
        Actualizar
      </Button>
      <div className="flex gap-2 ml-auto">
        <Button variant="ghost" size="sm" onClick={() => setPreset(7)}>Esta semana</Button>
        <Button variant="ghost" size="sm" onClick={() => setPreset(14)}>Próximos 14 días</Button>
        <Button variant="ghost" size="sm" onClick={() => setPreset(30)}>Este mes</Button>
      </div>
    </div>
  );
}

function ProductRow({ product }: { product: ProductionPlan["products"][number] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="hover:bg-muted/20 transition-colors cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            <span className="font-medium">{product.product_name}</span>
          </div>
          {product.recipe_name && (
            <p className="text-xs text-muted-foreground ml-5">Receta: {product.recipe_name}</p>
          )}
        </td>
        <td className="px-4 py-3 text-right font-semibold">
          {formatQty(product.total_quantity, product.unit === "receta(s)" ? "receta(s)" : "")}
          {" "}
          <span className="text-muted-foreground font-normal text-xs">{product.unit}</span>
        </td>
        <td className="px-4 py-3 text-center text-muted-foreground text-sm">
          {product.orders.length}
        </td>
      </tr>
      {open && (
        <tr className="bg-muted/10">
          <td colSpan={3} className="px-8 py-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left py-1">Pedido</th>
                  <th className="text-left py-1">Cliente</th>
                  <th className="text-left py-1">Entrega</th>
                  <th className="text-right py-1">Cant.</th>
                </tr>
              </thead>
              <tbody>
                {product.orders.map((o, i) => (
                  <tr key={i} className="border-t border-border/40">
                    <td className="py-1 font-mono">{o.order_number}</td>
                    <td className="py-1">{o.customer}</td>
                    <td className="py-1 text-muted-foreground">
                      {o.delivery_date ? formatDate(o.delivery_date) : "—"}
                    </td>
                    <td className="py-1 text-right">{o.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

export function ProduccionView({
  plan,
  from,
  to,
}: {
  plan: ProductionPlan;
  from: string;
  to: string;
}) {
  return (
    <div className="space-y-5">
      <DateRangeForm from={from} to={to} />

      {/* Summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {formatDate(from)} — {formatDate(to)}
        </span>
        <span>·</span>
        <span>
          <strong className="text-foreground">{plan.orders_count}</strong>{" "}
          {plan.orders_count === 1 ? "pedido" : "pedidos"} activos en el período
        </span>
      </div>

      {plan.orders_count === 0 ? (
        <div className="border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground text-sm">
            Sin pedidos activos para este período.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {/* Productos */}
          <div className="border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Qué preparar</span>
            </div>
            {plan.products.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">Sin productos.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Producto</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Total</th>
                    <th className="text-center px-4 py-2 font-medium text-muted-foreground text-xs">Pedidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {plan.products.map((p) => (
                    <ProductRow key={p.product_id} product={p} />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Ingredientes */}
          <div className="border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Materias primas necesarias</span>
            </div>
            {plan.ingredients.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">
                Sin recetas vinculadas a los productos.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Materia prima</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Necesario</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">En stock</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">A comprar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {plan.ingredients.map((ing) => {
                    const missing = Math.max(0, ing.total_quantity - ing.stock_quantity);
                    const ok = missing === 0;
                    return (
                      <tr key={ing.raw_material_id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{ing.raw_material_name}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-primary">
                          {formatQty(ing.total_quantity, ing.unit)}
                        </td>
                        <td className={cn(
                          "px-4 py-3 text-right font-mono",
                          ok ? "text-green-600" : "text-muted-foreground"
                        )}>
                          {formatQty(ing.stock_quantity, ing.unit)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {ok ? (
                            <span className="text-green-600 text-xs">✓ Suficiente</span>
                          ) : (
                            <span className="text-red-500 font-semibold">
                              {formatQty(missing, ing.unit)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

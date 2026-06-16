"use client";

import { useState, useTransition } from "react";
import { type StockItem, registerPurchase, adjustStock } from "@/lib/actions/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingCart, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

function formatQty(qty: number, unit: string): string {
  if (unit === "g") {
    return qty >= 1000
      ? `${(qty / 1000).toFixed(2).replace(/\.?0+$/, "")} kg`
      : `${qty.toFixed(0)} g`;
  }
  if (unit === "ml") {
    return qty >= 1000
      ? `${(qty / 1000).toFixed(2).replace(/\.?0+$/, "")} l`
      : `${qty.toFixed(0)} ml`;
  }
  return `${qty % 1 === 0 ? qty : qty.toFixed(2)} ${unit}`;
}

type DialogState = { open: boolean; item: StockItem | null };

export function StockView({ items }: { items: StockItem[] }) {
  const [purchase, setPurchase] = useState<DialogState>({ open: false, item: null });
  const [adjust, setAdjust] = useState<DialogState>({ open: false, item: null });
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openPurchase(item: StockItem) {
    setQty("");
    setNotes("");
    setError(null);
    setPurchase({ open: true, item });
  }

  function openAdjust(item: StockItem) {
    setQty(String(item.stock_quantity));
    setNotes("");
    setError(null);
    setAdjust({ open: true, item });
  }

  function closePurchase() {
    setPurchase({ open: false, item: null });
  }

  function closeAdjust() {
    setAdjust({ open: false, item: null });
  }

  function handlePurchase() {
    if (!purchase.item) return;
    const q = parseFloat(qty);
    if (isNaN(q) || q <= 0) {
      setError("Ingresá una cantidad válida");
      return;
    }
    startTransition(async () => {
      const res = await registerPurchase(purchase.item!.id, q, notes);
      if ("error" in res) { setError(res.error); return; }
      closePurchase();
    });
  }

  function handleAdjust() {
    if (!adjust.item) return;
    const q = parseFloat(qty);
    if (isNaN(q) || q < 0) {
      setError("Ingresá una cantidad válida");
      return;
    }
    startTransition(async () => {
      const res = await adjustStock(adjust.item!.id, q, notes);
      if ("error" in res) { setError(res.error); return; }
      closeAdjust();
    });
  }

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Materia prima</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unidad</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stock actual</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  Sin materias primas activas.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "font-mono font-semibold",
                      item.stock_quantity === 0 ? "text-red-500" : "text-foreground"
                    )}
                  >
                    {formatQty(item.stock_quantity, item.unit)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => openPurchase(item)}
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Compra
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => openAdjust(item)}
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      Ajustar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Purchase dialog */}
      <Dialog open={purchase.open} onOpenChange={(open) => !open && closePurchase()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar compra — {purchase.item?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Cantidad comprada ({purchase.item?.unit})</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={qty}
                onChange={(e) => { setQty(e.target.value); setError(null); }}
                placeholder="0"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notas (opcional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Proveedor, factura, etc."
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={closePurchase}>
                Cancelar
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={isPending}
                className="gradient-brand text-white border-0"
              >
                {isPending ? "Guardando…" : "Registrar compra"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust dialog */}
      <Dialog open={adjust.open} onOpenChange={(open) => !open && closeAdjust()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar stock — {adjust.item?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Ingresá el nuevo stock total. Esto sobrescribe el valor actual.
            </p>
            <div className="space-y-1.5">
              <Label>Nuevo stock ({adjust.item?.unit})</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={qty}
                onChange={(e) => { setQty(e.target.value); setError(null); }}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Motivo del ajuste</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Corrección de inventario, merma, etc."
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={closeAdjust}>
                Cancelar
              </Button>
              <Button
                onClick={handleAdjust}
                disabled={isPending}
                className="gradient-brand text-white border-0"
              >
                {isPending ? "Guardando…" : "Guardar ajuste"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

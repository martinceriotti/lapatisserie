"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import {
  type StockItem,
  type StockMovement,
  registerPurchase,
  adjustStock,
  getStockMovements,
} from "@/lib/actions/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingCart, SlidersHorizontal, History, Search, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const REASON_LABELS: Record<StockMovement["reason"], string> = {
  compra: "Compra",
  ajuste: "Ajuste",
  produccion: "Producción",
  venta: "Venta",
};

const REASON_COLORS: Record<StockMovement["reason"], string> = {
  compra: "bg-green-100 text-green-700",
  ajuste: "bg-blue-100 text-blue-700",
  produccion: "bg-orange-100 text-orange-700",
  venta: "bg-red-100 text-red-700",
};

// ── Sub-dialogs ────────────────────────────────────────────────────────────────

type MutDialogState = { open: boolean; item: StockItem | null };

function PurchaseDialog({
  state,
  onClose,
}: {
  state: MutDialogState;
  onClose: () => void;
}) {
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isProduction = state.item?.material_type !== "materia_prima";
  const title = isProduction ? "Registrar producción" : "Registrar compra";
  const notesPlaceholder = isProduction
    ? "Lote, fecha de elaboración, etc."
    : "Proveedor, factura, etc.";

  function reset() { setQty(""); setNotes(""); setError(null); }

  function handleOpen(open: boolean) {
    if (!open) { reset(); onClose(); }
  }

  function handleSubmit() {
    const q = parseFloat(qty);
    if (isNaN(q) || q <= 0) { setError("Ingresá una cantidad válida"); return; }
    const reason = isProduction ? "produccion" : "compra";
    startTransition(async () => {
      const res = await registerPurchase(state.item!.id, q, notes, reason);
      if ("error" in res) { setError(res.error); return; }
      reset();
      onClose();
    });
  }

  return (
    <Dialog open={state.open} onOpenChange={handleOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title} — {state.item?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Cantidad {isProduction ? "elaborada" : "comprada"} ({state.item?.unit})</Label>
            <Input
              type="number" min="0" step="any"
              value={qty}
              onChange={(e) => { setQty(e.target.value); setError(null); }}
              placeholder="0" autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={notesPlaceholder}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="gradient-brand text-white border-0">
              {isPending ? "Guardando…" : title}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdjustDialog({
  state,
  onClose,
}: {
  state: MutDialogState;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(String(state.item?.stock_quantity ?? ""));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sync qty when item changes
  if (state.item && qty === "" && state.item.stock_quantity !== undefined) {
    setQty(String(state.item.stock_quantity));
  }

  function reset() { setQty(""); setNotes(""); setError(null); }

  function handleOpen(open: boolean) {
    if (!open) { reset(); onClose(); }
  }

  function handleSubmit() {
    const q = parseFloat(qty);
    if (isNaN(q) || q < 0) { setError("Ingresá una cantidad válida"); return; }
    startTransition(async () => {
      const res = await adjustStock(state.item!.id, q, notes);
      if ("error" in res) { setError(res.error); return; }
      reset();
      onClose();
    });
  }

  return (
    <Dialog open={state.open} onOpenChange={handleOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar stock — {state.item?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Ingresá el nuevo stock total. Esto sobrescribe el valor actual.
          </p>
          <div className="space-y-1.5">
            <Label>Nuevo stock ({state.item?.unit})</Label>
            <Input
              type="number" min="0" step="any"
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
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="gradient-brand text-white border-0">
              {isPending ? "Guardando…" : "Guardar ajuste"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({
  item,
  onClose,
}: {
  item: StockItem | null;
  onClose: () => void;
}) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item) { setMovements([]); return; }
    setLoading(true);
    getStockMovements(item.id).then((data) => {
      setMovements(data);
      setLoading(false);
    });
  }, [item?.id]);

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Historial de movimientos — {item?.name}</DialogTitle>
        </DialogHeader>

        {/* Current stock pill */}
        {item && (
          <div className="flex items-center gap-2 pb-1">
            <span className="text-sm text-muted-foreground">Stock actual:</span>
            <span className={cn(
              "font-mono font-semibold text-sm",
              item.stock_quantity === 0 ? "text-red-500" : "text-foreground"
            )}>
              {formatQty(item.stock_quantity, item.unit)}
            </span>
          </div>
        )}

        <div className="border border-border rounded-xl overflow-hidden">
          {loading ? (
            <p className="text-sm text-muted-foreground p-6 text-center">Cargando…</p>
          ) : movements.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">
              Sin movimientos registrados todavía.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {movements.map((m) => {
                const isPositive = m.quantity >= 0;
                return (
                  <div key={m.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                    {/* Date */}
                    <span className="text-muted-foreground text-xs whitespace-nowrap mt-0.5 w-28 shrink-0">
                      {formatDateTime(m.created_at)}
                    </span>

                    {/* Reason */}
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0",
                      REASON_COLORS[m.reason]
                    )}>
                      {REASON_LABELS[m.reason]}
                    </span>

                    {/* Quantity */}
                    <span className={cn(
                      "font-mono font-semibold whitespace-nowrap shrink-0 ml-auto",
                      isPositive ? "text-green-600" : "text-red-500"
                    )}>
                      {isPositive ? "+" : ""}
                      {item ? formatQty(m.quantity, item.unit) : `${m.quantity}`}
                    </span>

                    {/* Notes */}
                    {m.notes && (
                      <span className="text-muted-foreground text-xs truncate min-w-0" title={m.notes}>
                        {m.notes}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

const TYPE_TABS = [
  { key: "all", label: "Todos" },
  { key: "materia_prima", label: "Materias primas" },
  { key: "intermedio", label: "Intermedios" },
  { key: "producto_terminado", label: "Producto terminado" },
] as const;

export function StockView({ items }: { items: StockItem[] }) {
  const [purchase, setPurchase] = useState<MutDialogState>({ open: false, item: null });
  const [adjust, setAdjust] = useState<MutDialogState>({ open: false, item: null });
  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);
  const [search, setSearch] = useState("");
  const [typeTab, setTypeTab] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((i) => {
      if (typeTab !== "all" && i.material_type !== typeTab) return false;
      if (q && !i.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, typeTab]);

  return (
    <div className="space-y-4">
      {/* Search + type tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 w-52"
          />
        </div>
        <div className="flex gap-1 bg-muted/40 p-1 rounded-xl">
          {TYPE_TABS.map((t) => {
            const count = t.key === "all"
              ? items.length
              : items.filter((i) => i.material_type === t.key).length;
            return (
              <button
                key={t.key}
                onClick={() => setTypeTab(t.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  typeTab === t.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                <span className={cn("ml-1.5", typeTab === t.key ? "text-primary" : "text-muted-foreground/60")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? "Sin resultados." : "Sin materias primas activas."}
                </td>
              </tr>
            )}
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                <td className="px-4 py-3 text-right">
                  <span className={cn(
                    "font-mono font-semibold",
                    item.stock_quantity === 0 ? "text-red-500" : "text-foreground"
                  )}>
                    {formatQty(item.stock_quantity, item.unit)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Button
                      variant="outline" size="sm" className="gap-1.5 text-xs"
                      onClick={() => setPurchase({ open: true, item })}
                    >
                      {item.material_type === "materia_prima"
                        ? <ShoppingCart className="w-3 h-3" />
                        : <ChefHat className="w-3 h-3" />}
                      {item.material_type === "materia_prima" ? "Compra" : "Producción"}
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="gap-1.5 text-xs"
                      onClick={() => setAdjust({ open: true, item })}
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      Ajustar
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground"
                      onClick={() => setHistoryItem(item)}
                    >
                      <History className="w-3 h-3" />
                      Historial
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PurchaseDialog
        state={purchase}
        onClose={() => setPurchase({ open: false, item: null })}
      />
      <AdjustDialog
        state={adjust}
        onClose={() => setAdjust({ open: false, item: null })}
      />
      <HistoryDialog
        item={historyItem}
        onClose={() => setHistoryItem(null)}
      />
    </div>
  );
}

"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  addOrderItem,
  removeOrderItem,
  updateOrderStatus,
  updatePaymentStatus,
  updateDiscount,
  updateOrderMeta,
  deleteOrder,
  type OrderWithItems,
  type OrderItem,
  type ProductForOrder,
  type Customer,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/actions/pedidos";
import { STATUS_LABELS, STATUS_FLOW, PAYMENT_LABELS } from "@/lib/constants/pedidos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Plus, Loader2, ChevronRight, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const STATUS_COLORS: Record<OrderStatus, string> = {
  borrador: "bg-muted text-muted-foreground border-transparent",
  presupuestado: "bg-blue-100 text-blue-700 border-transparent",
  confirmado: "bg-indigo-100 text-indigo-700 border-transparent",
  en_produccion: "bg-amber-100 text-amber-700 border-transparent",
  listo: "bg-orange-100 text-orange-700 border-transparent",
  entregado: "bg-teal-100 text-teal-700 border-transparent",
  pagado: "bg-green-100 text-green-700 border-transparent",
  cancelado: "bg-red-100 text-red-700 border-transparent",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Add Item Form ──────────────────────────────────────────────────────────────

function AddItemForm({
  orderId,
  products,
  onAdded,
}: {
  orderId: string;
  products: ProductForOrder[];
  onAdded: (item: OrderItem) => void;
}) {
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [customization, setCustomization] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedVariant = selectedProduct?.variants.find((v) => v.id === variantId);

  function handleProductChange(id: string | null) {
    setProductId(id ?? "");
    setVariantId("");
    const p = products.find((p) => p.id === id);
    setUnitPrice(p?.suggested_price ?? p?.base_price ?? 0);
  }

  function handleVariantChange(id: string | null) {
    setVariantId(id ?? "");
    if (!selectedProduct) return;
    const v = selectedProduct.variants.find((v) => v.id === id);
    if (!v) return;
    const base = selectedProduct.suggested_price ?? selectedProduct.base_price ?? 0;
    const price = v.price_override ?? base + (v.additional_cost ?? 0);
    setUnitPrice(price);
  }

  function getDescription() {
    if (!selectedProduct) return "";
    if (selectedVariant) return `${selectedProduct.name} — ${selectedVariant.name}`;
    return selectedProduct.name;
  }

  function handleAdd() {
    if (!productId || quantity <= 0) return;
    setError(null);
    startTransition(async () => {
      const desc = getDescription();
      const result = await addOrderItem(orderId, productId, variantId || null, desc, quantity, unitPrice, customization);
      if ("error" in result) {
        setError(typeof result.error === "string" ? result.error : "Error al agregar ítem");
        return;
      }
      onAdded({
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: productId,
        variant_id: variantId || null,
        description: desc,
        quantity,
        unit_price: unitPrice,
        customization: customization || null,
        notes: null,
        product: selectedProduct ? { id: selectedProduct.id, name: selectedProduct.name } : null,
        variant: selectedVariant ? { id: selectedVariant.id, name: selectedVariant.name } : null,
      });
      setProductId("");
      setVariantId("");
      setQuantity(1);
      setUnitPrice(0);
      setCustomization("");
    });
  }

  return (
    <div className="border-t border-dashed border-border pt-4 space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Agregar ítem</p>

      {/* Producto — ancho completo */}
      <div className="space-y-1">
        <Label className="text-xs">Producto</Label>
        <Select value={productId} onValueChange={handleProductChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: string | null) => v ? (products.find((p) => p.id === v)?.name ?? "—") : "Seleccionar producto..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="w-[var(--radix-select-trigger-width)]">
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Variante */}
        <div className="space-y-1">
          <Label className="text-xs">Variante</Label>
          <Select
            value={variantId}
            onValueChange={handleVariantChange}
            disabled={!selectedProduct || selectedProduct.variants.length === 0}
          >
            <SelectTrigger>
              <SelectValue>
                {(v: string | null) => v ? (selectedProduct?.variants.find((vv) => vv.id === v)?.name ?? "—") : "Sin variante"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin variante</SelectItem>
              {selectedProduct?.variants.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cantidad */}
        <div className="space-y-1">
          <Label className="text-xs">Cantidad</Label>
          <Input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>

        {/* Precio unitario */}
        <div className="space-y-1">
          <Label className="text-xs">Precio unitario</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className="pl-7"
            />
          </div>
        </div>
      </div>

      {/* Personalización */}
      <Input
        placeholder="Personalización (opcional): 'Feliz cumpleaños María'..."
        value={customization}
        onChange={(e) => setCustomization(e.target.value)}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !productId || quantity <= 0}
          size="sm"
          className="gradient-brand text-white border-0 gap-1.5"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Agregar
        </Button>
      </div>
    </div>
  );
}

// ── Edit Order Meta Dialog ─────────────────────────────────────────────────────

function EditMetaDialog({
  order,
  customers,
  open,
  onClose,
}: {
  order: OrderWithItems;
  customers: Customer[];
  open: boolean;
  onClose: () => void;
}) {
  const [customerId, setCustomerId] = useState(order.customer_id);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("customer_id", customerId);
    startTransition(async () => {
      const result = await updateOrderMeta(order.id, null, fd);
      if ("error" in result) {
        setErrors(typeof result.error === "string" ? { _: [result.error] } : result.error as Record<string, string[]>);
        return;
      }
      onClose();
      window.location.reload();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setErrors(null); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Editar pedido</DialogTitle></DialogHeader>
        <form id="meta-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
              <SelectTrigger>
                <SelectValue>
                  {(v: string | null) => v ? (customers.find((c) => c.id === v)?.name ?? "—") : "—"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ed-event">Fecha evento</Label>
              <Input id="ed-event" name="event_date" type="date" defaultValue={order.event_date ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-delivery">Fecha entrega</Label>
              <Input id="ed-delivery" name="delivery_date" type="date" defaultValue={order.delivery_date ?? ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ed-notes">Notas</Label>
            <Textarea id="ed-notes" name="notes" defaultValue={order.notes ?? ""} rows={3} className="resize-none" />
          </div>
          {errors?._ && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{errors._[0]}</p>}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button form="meta-form" type="submit" disabled={isPending} className="gradient-brand text-white border-0">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function PedidoDetail({
  order: initialOrder,
  products,
  customers,
  depositPct,
}: {
  order: OrderWithItems;
  products: ProductForOrder[];
  customers: Customer[];
  depositPct: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState<OrderItem[]>(initialOrder.items);
  const [status, setStatus] = useState<OrderStatus>(initialOrder.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialOrder.payment_status);
  const [subtotal, setSubtotal] = useState(Number(initialOrder.subtotal));
  const [discount, setDiscount] = useState(Number(initialOrder.discount));
  const [depositAmount, setDepositAmount] = useState<number>(
    initialOrder.deposit_amount != null
      ? Number(initialOrder.deposit_amount)
      : Math.round(Number(initialOrder.total ?? 0) * depositPct / 100)
  );
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState(String(discount));
  const [openEdit, setOpenEdit] = useState(false);
  const [isPending, startTransition] = useTransition();

  const total = subtotal - discount;
  const suggestedDeposit = Math.round(total * depositPct / 100);

  // Status flow
  const currentIdx = STATUS_FLOW.indexOf(status);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIdx + 1]
    : null;

  function handleAddItem(item: OrderItem) {
    setItems((prev) => [...prev, item]);
    const newSubtotal = subtotal + item.quantity * item.unit_price;
    setSubtotal(newSubtotal);
    setDepositAmount(Math.round((newSubtotal - discount) * depositPct / 100));
  }

  function handleRemoveItem(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    const newSubtotal = subtotal - item.quantity * item.unit_price;
    setSubtotal(newSubtotal);
    setDepositAmount(Math.round((newSubtotal - discount) * depositPct / 100));
    startTransition(async () => {
      await removeOrderItem(itemId, initialOrder.id);
    });
  }

  function handleAdvanceStatus() {
    if (!nextStatus) return;
    const prev = status;
    setStatus(nextStatus);
    startTransition(async () => {
      const result = await updateOrderStatus(initialOrder.id, nextStatus);
      if ("error" in result) setStatus(prev);
    });
  }

  function handleCancelOrder() {
    if (!confirm("¿Cancelar este pedido?")) return;
    const prev = status;
    setStatus("cancelado");
    startTransition(async () => {
      const result = await updateOrderStatus(initialOrder.id, "cancelado");
      if ("error" in result) setStatus(prev);
    });
  }

  function handleMarkDeposit() {
    const prev = paymentStatus;
    setPaymentStatus("partial");
    startTransition(async () => {
      const result = await updatePaymentStatus(initialOrder.id, "partial", depositAmount);
      if ("error" in result) setPaymentStatus(prev);
    });
  }

  function handleMarkPaid() {
    const prev = paymentStatus;
    setPaymentStatus("paid");
    startTransition(async () => {
      const result = await updatePaymentStatus(initialOrder.id, "paid");
      if ("error" in result) setPaymentStatus(prev);
    });
  }

  function handleSaveDiscount() {
    const val = parseFloat(discountInput) || 0;
    const prev = discount;
    setDiscount(val);
    setEditingDiscount(false);
    startTransition(async () => {
      const result = await updateDiscount(initialOrder.id, val);
      if ("error" in result) { setDiscount(prev); setDiscountInput(String(prev)); }
    });
  }

  function handleDelete() {
    if (!confirm("¿Eliminar este pedido permanentemente?")) return;
    startTransition(async () => {
      await deleteOrder(initialOrder.id);
      router.push("/admin/pedidos");
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/pedidos")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl">{initialOrder.order_number}</h1>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[status])}>
                {STATUS_LABELS[status]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Creado el {new Date(initialOrder.created_at).toLocaleDateString("es-AR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpenEdit(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Editar
          </Button>
          {status !== "cancelado" && status !== "pagado" && (
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleCancelOrder}>
              Cancelar pedido
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-destructive/60 hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status flow */}
      <div className="border border-border rounded-2xl p-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUS_FLOW.map((s, i) => {
            const idx = STATUS_FLOW.indexOf(status);
            const done = i <= idx && status !== "cancelado";
            const current = s === status;
            return (
              <div key={s} className="flex items-center gap-1 shrink-0">
                <span className={cn(
                  "text-xs px-2.5 py-1 rounded-full transition-colors",
                  current && "font-semibold",
                  done ? STATUS_COLORS[s] : "text-muted-foreground/40",
                )}>
                  {STATUS_LABELS[s]}
                </span>
                {i < STATUS_FLOW.length - 1 && (
                  <ChevronRight className={cn("w-3 h-3 shrink-0", done && i < idx ? "text-muted-foreground" : "text-muted-foreground/30")} />
                )}
              </div>
            );
          })}
        </div>
        {nextStatus && status !== "cancelado" && (
          <div className="mt-3 pt-3 border-t border-border flex justify-end">
            <Button
              size="sm"
              onClick={handleAdvanceStatus}
              disabled={isPending}
              className="gradient-brand text-white border-0 gap-1.5"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Marcar como {STATUS_LABELS[nextStatus]}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: info + items */}
        <div className="col-span-2 space-y-4">
          {/* Customer + dates */}
          <div className="border border-border rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-medium mt-0.5">{initialOrder.customer?.name ?? "—"}</p>
                {initialOrder.customer?.phone && (
                  <p className="text-sm text-muted-foreground">{initialOrder.customer.phone}</p>
                )}
                {initialOrder.customer?.email && (
                  <p className="text-sm text-muted-foreground">{initialOrder.customer.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Fecha evento</p>
                  <p className="text-sm mt-0.5">{formatDate(initialOrder.event_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha entrega</p>
                  <p className="text-sm mt-0.5">{formatDate(initialOrder.delivery_date)}</p>
                </div>
              </div>
            </div>
            {initialOrder.notes && (
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Notas</p>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">{initialOrder.notes}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border border-border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold">Ítems del pedido</p>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sin ítems todavía. Agregá productos abajo.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-muted-foreground">Descripción</th>
                    <th className="text-center py-2 font-medium text-muted-foreground w-16">Cant.</th>
                    <th className="text-right py-2 font-medium text-muted-foreground w-24">P. unit.</th>
                    <th className="text-right py-2 font-medium text-muted-foreground w-24">Subtotal</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5">
                        <p className="font-medium">{item.description}</p>
                        {item.customization && (
                          <p className="text-xs text-muted-foreground italic">{item.customization}</p>
                        )}
                      </td>
                      <td className="py-2.5 text-center">{item.quantity}</td>
                      <td className="py-2.5 text-right font-mono text-xs">{ARS.format(item.unit_price)}</td>
                      <td className="py-2.5 text-right font-mono font-semibold text-xs">
                        {ARS.format(item.quantity * item.unit_price)}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-muted-foreground/40 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <AddItemForm orderId={initialOrder.id} products={products} onAdded={handleAddItem} />
          </div>
        </div>

        {/* Right: totals + payment */}
        <div className="space-y-4">
          {/* Totals */}
          <div className="border border-border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold">Resumen</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{ARS.format(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Descuento</span>
                {editingDiscount ? (
                  <div className="flex items-center gap-1">
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                      <Input
                        type="number"
                        min="0"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveDiscount(); if (e.key === "Escape") setEditingDiscount(false); }}
                        className="h-6 text-xs pl-5 pr-1"
                        autoFocus
                      />
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={handleSaveDiscount}>OK</Button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setDiscountInput(String(discount)); setEditingDiscount(true); }}
                    className="font-mono hover:text-primary transition-colors"
                  >
                    {discount > 0 ? `−${ARS.format(discount)}` : ARS.format(0)}
                  </button>
                )}
              </div>
              <div className="flex justify-between font-semibold border-t border-border pt-2">
                <span>Total</span>
                <span className="font-mono text-primary">{ARS.format(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Pago</p>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                paymentStatus === "paid" && "bg-green-100 text-green-700",
                paymentStatus === "partial" && "bg-amber-100 text-amber-700",
                paymentStatus === "pending" && "bg-muted text-muted-foreground",
              )}>
                {PAYMENT_LABELS[paymentStatus]}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Seña ({depositPct}%)</span>
                <span className="font-mono text-xs">{ARS.format(depositAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Saldo</span>
                <span className="font-mono text-xs">{ARS.format(Math.max(0, total - depositAmount))}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {paymentStatus === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-amber-700 border-amber-200 hover:bg-amber-50"
                  onClick={handleMarkDeposit}
                  disabled={isPending}
                >
                  Seña cobrada — {ARS.format(depositAmount)}
                </Button>
              )}
              {paymentStatus === "partial" && (
                <Button
                  size="sm"
                  className="w-full gradient-brand text-white border-0"
                  onClick={handleMarkPaid}
                  disabled={isPending}
                >
                  Saldo cobrado — {ARS.format(Math.max(0, total - depositAmount))}
                </Button>
              )}
              {paymentStatus === "paid" && (
                <p className="text-xs text-center text-green-600 font-medium">Pagado en su totalidad</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditMetaDialog
        order={initialOrder}
        customers={customers}
        open={openEdit}
        onClose={() => setOpenEdit(false)}
      />
    </div>
  );
}

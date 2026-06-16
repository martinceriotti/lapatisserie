"use client";

import { useState, useTransition, useCallback, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  createCustomer,
  createOrder,
  type Customer,
  type ActionResult,
} from "@/lib/actions/pedidos";
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
import { Loader2, UserPlus } from "lucide-react";

type FormErrors = Record<string, string[]>;

function CustomerDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FormErrors | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createCustomer(null, fd);
      if ("error" in result) {
        setErrors(typeof result.error === "string" ? { _: [result.error] } : result.error as FormErrors);
        return;
      }
      if ("id" in result && result.id) {
        onCreated({
          id: result.id,
          name: fd.get("name") as string,
          phone: (fd.get("phone") as string) || null,
          email: (fd.get("email") as string) || null,
          address: null,
          neighborhood: null,
          notes: null,
          created_at: new Date().toISOString(),
        });
        setErrors(null);
        onClose();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setErrors(null); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>
        <form id="customer-form" onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Nombre</Label>
            <Input id="c-name" name="name" placeholder="Nombre completo" required />
            {errors?.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-phone">Teléfono</Label>
            <Input id="c-phone" name="phone" placeholder="+54 341..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-email">Email</Label>
            <Input id="c-email" name="email" type="email" placeholder="ejemplo@mail.com" />
            {errors?.email && <p className="text-xs text-destructive">{errors.email[0]}</p>}
          </div>
          {errors?._ && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {errors._[0]}
            </p>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button form="customer-form" type="submit" disabled={isPending} className="gradient-brand text-white border-0">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PedidoNuevo({ customers: initialCustomers }: { customers: Customer[] }) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [customerId, setCustomerId] = useState("");
  const [openNewCustomer, setOpenNewCustomer] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FormErrors | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("customer_id", customerId);
    startTransition(async () => {
      const result = await createOrder(null, fd);
      if ("error" in result) {
        setErrors(typeof result.error === "string" ? { _: [result.error] } : result.error as FormErrors);
        return;
      }
      if ("id" in result && result.id) {
        router.push(`/admin/pedidos/${result.id}`);
      }
    });
  }

  return (
    <>
      <div className="border border-border rounded-2xl bg-surface p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cliente */}
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <div className="flex gap-2">
              <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
                <SelectTrigger className="flex-1">
                  <SelectValue>
                    {(v: string | null) => {
                      if (!v) return "Seleccionar cliente...";
                      return customers.find((c) => c.id === v)?.name ?? "Seleccionar cliente...";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span>{c.name}</span>
                      {c.phone && <span className="text-muted-foreground text-xs ml-2">{c.phone}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setOpenNewCustomer(true)}
                title="Nuevo cliente"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
            {errors?.customer_id && <p className="text-xs text-destructive">{errors.customer_id[0]}</p>}
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="event-date">Fecha del evento</Label>
              <Input id="event-date" name="event_date" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delivery-date">Fecha de entrega</Label>
              <Input id="delivery-date" name="delivery_date" type="date" />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Detalles del pedido, dirección de entrega, etc."
              rows={3}
              className="resize-none"
            />
          </div>

          {errors?._ && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {errors._[0]}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !customerId}
              className="gradient-brand text-white border-0"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear pedido
            </Button>
          </div>
        </form>
      </div>

      <CustomerDialog
        open={openNewCustomer}
        onClose={() => setOpenNewCustomer(false)}
        onCreated={(c) => {
          setCustomers((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)));
          setCustomerId(c.id);
        }}
      />
    </>
  );
}

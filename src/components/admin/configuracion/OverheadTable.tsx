"use client";

import { useState, useTransition, useCallback } from "react";
import {
  createOverheadItem,
  updateOverheadItem,
  toggleOverheadItem,
  deleteOverheadItem,
  type OverheadItem,
  type ActionResult,
} from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type FormErrors = Record<string, string[]>;

function OverheadForm({
  defaultValues,
  onSubmit,
  loading,
  errors,
}: {
  defaultValues?: Partial<OverheadItem>;
  onSubmit: (fd: FormData) => void;
  loading: boolean;
  errors: FormErrors | null;
}) {
  const [type, setType] = useState<string>(defaultValues?.type ?? "percentage");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("type", type);
    fd.set("is_active", "true");
    onSubmit(fd);
  }

  return (
    <form id="overhead-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="oh-name">Nombre</Label>
        <Input
          id="oh-name"
          name="name"
          defaultValue={defaultValues?.name}
          placeholder="Ej: Mano de obra"
          required
        />
        {errors?.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => v && setType(v)}>
            <SelectTrigger>
              <SelectValue>
                {(v: string | null) =>
                  v === "percentage" ? "Porcentaje (%)" : v === "fixed_amount" ? "Monto fijo ($)" : "—"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Porcentaje (%)</SelectItem>
              <SelectItem value="fixed_amount">Monto fijo ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="oh-value">
            {type === "percentage" ? "Porcentaje" : "Monto"}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {type === "percentage" ? "%" : "$"}
            </span>
            <Input
              id="oh-value"
              name="value"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={defaultValues?.value}
              placeholder={type === "percentage" ? "20" : "1000"}
              className="pl-7"
              required
            />
          </div>
          {errors?.value && <p className="text-xs text-destructive">{errors.value[0]}</p>}
        </div>
      </div>

      {errors?._ && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {errors._[0]}
        </p>
      )}
    </form>
  );
}

export function OverheadTable({ initialData }: { initialData: OverheadItem[] }) {
  const [items, setItems] = useState(initialData);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<OverheadItem | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalActivePercent = items
    .filter((i) => i.is_active && i.type === "percentage")
    .reduce((sum, i) => sum + i.value, 0);

  const handleCreate = useCallback((fd: FormData) => {
    startTransition(async () => {
      const result = await createOverheadItem(null, fd);
      if ("error" in result) {
        setFormErrors(
          typeof result.error === "string" ? { _: [result.error] } : (result.error as FormErrors)
        );
        return;
      }
      setOpenCreate(false);
      setFormErrors(null);
      window.location.reload();
    });
  }, []);

  const handleUpdate = useCallback((fd: FormData) => {
    if (!editing) return;
    startTransition(async () => {
      const result = await updateOverheadItem(editing.id, null, fd);
      if ("error" in result) {
        setFormErrors(
          typeof result.error === "string" ? { _: [result.error] } : (result.error as FormErrors)
        );
        return;
      }
      setEditing(null);
      setFormErrors(null);
      window.location.reload();
    });
  }, [editing]);

  const handleToggle = useCallback((id: string, current: boolean) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_active: !current } : i)));
    startTransition(async () => {
      const result = await toggleOverheadItem(id, !current);
      if ("error" in result) window.location.reload();
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    startTransition(async () => {
      await deleteOverheadItem(id);
      window.location.reload();
    });
  }, []);

  return (
    <div className="space-y-3">
      <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground p-4">Sin ítems de overhead configurados.</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3",
              !item.is_active && "opacity-50"
            )}
          >
            {/* Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={item.is_active}
              onClick={() => handleToggle(item.id, item.is_active)}
              disabled={isPending}
              className={cn(
                "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
                item.is_active ? "bg-primary" : "bg-muted-foreground/30"
              )}
              title={item.is_active ? "Desactivar" : "Activar"}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                  item.is_active ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>

            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{item.name}</span>
            </div>

            <span className="text-sm font-mono font-semibold text-right w-20">
              {item.type === "percentage"
                ? `${item.value}%`
                : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(item.value)}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => { setFormErrors(null); setEditing(item); }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {totalActivePercent > 0 && (
        <p className="text-xs text-muted-foreground">
          Total porcentual activo: <strong>{totalActivePercent}%</strong> sobre costo de ingredientes
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => { setFormErrors(null); setOpenCreate(true); }}
        className="gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        Agregar ítem
      </Button>

      {/* Create dialog */}
      <Dialog open={openCreate} onOpenChange={(o) => { setOpenCreate(o); if (!o) setFormErrors(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo overhead</DialogTitle>
          </DialogHeader>
          <OverheadForm onSubmit={handleCreate} loading={isPending} errors={formErrors} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
            <Button form="overhead-form" type="submit" disabled={isPending} className="gradient-brand text-white border-0">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) { setEditing(null); setFormErrors(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar overhead</DialogTitle>
          </DialogHeader>
          {editing && (
            <OverheadForm
              defaultValues={editing}
              onSubmit={handleUpdate}
              loading={isPending}
              errors={formErrors}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button form="overhead-form" type="submit" disabled={isPending} className="gradient-brand text-white border-0">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

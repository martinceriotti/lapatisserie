"use client";

import { Fragment, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createCliente,
  updateCliente,
  deleteCliente,
  type Cliente,
} from "@/lib/actions/clientes";
import { STATUS_LABELS } from "@/lib/constants/pedidos";
import type { OrderStatus } from "@/lib/constants/pedidos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Search, ChevronDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
});

function fecha(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type FormErrors = Record<string, string[]>;

function ClienteForm({
  defaultValues,
  onSubmit,
  errors,
}: {
  defaultValues?: Partial<Cliente>;
  onSubmit: (fd: FormData) => void;
  errors: FormErrors | null;
}) {
  return (
    <form
      id="cliente-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="c-name">Nombre *</Label>
        <Input id="c-name" name="name" defaultValue={defaultValues?.name} placeholder="Ej: Rosi Gómez" required />
        {errors?.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="c-phone">Teléfono</Label>
          <Input id="c-phone" name="phone" defaultValue={defaultValues?.phone ?? ""} placeholder="341 555-0000" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-neighborhood">Barrio</Label>
          <Input id="c-neighborhood" name="neighborhood" defaultValue={defaultValues?.neighborhood ?? ""} placeholder="Ej: Fisherton" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-email">Email</Label>
        <Input id="c-email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} placeholder="rosi@mail.com" />
        {errors?.email && <p className="text-xs text-destructive">{errors.email[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-address">Dirección</Label>
        <Input id="c-address" name="address" defaultValue={defaultValues?.address ?? ""} placeholder="Calle 1234" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-notes">Notas</Label>
        <Textarea
          id="c-notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          placeholder="Preferencias, alergias, cómo llegó al negocio…"
          rows={2}
          className="resize-none"
        />
      </div>

      {errors?._ && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{errors._[0]}</p>
      )}
    </form>
  );
}

function OrdersList({ cliente }: { cliente: Cliente }) {
  if (cliente.orders.length === 0) {
    return <p className="text-xs text-muted-foreground px-4 py-3">Sin pedidos.</p>;
  }
  return (
    <div className="px-4 py-3 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pedidos</p>
      {cliente.orders.map((o) => (
        <Link
          key={o.id}
          href={`/admin/pedidos/${o.id}`}
          className="flex items-center gap-3 text-sm py-1 hover:text-primary transition-colors"
        >
          <span className="font-mono text-xs">{o.order_number}</span>
          <span className="text-muted-foreground text-xs">{fecha(o.event_date ?? o.created_at.slice(0, 10))}</span>
          <span className="text-muted-foreground text-xs">{STATUS_LABELS[o.status as OrderStatus] ?? o.status}</span>
          <span className="ml-auto font-mono text-xs">{o.total != null ? ARS.format(Number(o.total)) : "—"}</span>
        </Link>
      ))}
    </div>
  );
}

export function ClientesTable({ initialData }: { initialData: Cliente[] }) {
  const router = useRouter();
  const data = initialData;

  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [deleting, setDeleting] = useState<Cliente | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const q = search.trim().toLowerCase();
  const filtered = q
    ? data.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q) ||
          (c.neighborhood ?? "").toLowerCase().includes(q)
      )
    : data;

  const handleCreate = useCallback((fd: FormData) => {
    startTransition(async () => {
      const result = await createCliente(null, fd);
      if ("error" in result) {
        setFormErrors(typeof result.error === "string" ? { _: [result.error] } : (result.error as FormErrors));
        return;
      }
      setOpenForm(false);
      setFormErrors(null);
      router.refresh();
    });
  }, [router]);

  const handleUpdate = useCallback((fd: FormData) => {
    if (!editing) return;
    startTransition(async () => {
      const result = await updateCliente(editing.id, null, fd);
      if ("error" in result) {
        setFormErrors(typeof result.error === "string" ? { _: [result.error] } : (result.error as FormErrors));
        return;
      }
      setEditing(null);
      setFormErrors(null);
      router.refresh();
    });
  }, [editing, router]);

  const handleDelete = useCallback(() => {
    if (!deleting) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteCliente(deleting.id);
      if ("error" in result) {
        setDeleteError(typeof result.error === "string" ? result.error : "Error al eliminar.");
        return;
      }
      setDeleting(null);
      router.refresh();
    });
  }, [deleting, router]);

  return (
    <>
      {/* Toolbar */}
      <div className="grid grid-cols-[1fr_auto] gap-3 mb-5 sm:flex sm:flex-row">
        <div className="relative col-span-2 sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o barrio…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => { setEditing(null); setFormErrors(null); setOpenForm(true); }}
          className="gradient-brand text-white border-0 hover:opacity-90 shrink-0"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Nuevo cliente</span>
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-1">Todavía no hay clientes</p>
          <p className="text-sm">Se crean solos al cargar un pedido, o agregá uno acá.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-border rounded-2xl p-12 text-center text-muted-foreground text-sm bg-surface">
          No se encontraron clientes.
        </div>
      ) : (
        <>
          {/* Lista — mobile */}
          <div className="md:hidden border border-border rounded-2xl overflow-hidden divide-y divide-border bg-surface">
            {filtered.map((c) => (
              <div key={c.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm flex-1 min-w-0">{c.name}</span>
                  <span className="font-mono text-sm font-semibold shrink-0">
                    {c.total_spent > 0 ? ARS.format(c.total_spent) : ""}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {[c.phone, c.neighborhood].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {c.order_count === 0
                      ? "Sin pedidos"
                      : `${c.order_count} pedido${c.order_count !== 1 ? "s" : ""} · últ. ${fecha(c.last_order_date)}`}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0 text-muted-foreground">
                    <button className="p-1.5 hover:text-foreground" onClick={() => { setEditing(c); setFormErrors(null); }} title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 hover:text-destructive" onClick={() => { setDeleting(c); setDeleteError(null); }} title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {c.order_count > 0 && (
                      <button
                        className="p-1.5 hover:text-foreground"
                        onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                        title="Ver pedidos"
                      >
                        <ChevronDown className={cn("w-4 h-4 transition-transform", expandedId === c.id && "rotate-180")} />
                      </button>
                    )}
                  </div>
                </div>
                {expandedId === c.id && (
                  <div className="-mx-4 mt-2 border-t border-border bg-muted/20">
                    <OrdersList cliente={c} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tabla — desktop */}
          <div className="hidden md:block border border-border rounded-2xl overflow-hidden bg-surface">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/50 hover:bg-accent/50">
                  <TableHead className="font-medium">Nombre</TableHead>
                  <TableHead className="font-medium">Teléfono</TableHead>
                  <TableHead className="font-medium">Barrio</TableHead>
                  <TableHead className="font-medium text-center">Pedidos</TableHead>
                  <TableHead className="font-medium">Último</TableHead>
                  <TableHead className="font-medium text-right">Total comprado</TableHead>
                  <TableHead className="font-medium text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <Fragment key={c.id}>
                    <TableRow
                      className={cn(c.order_count > 0 && "cursor-pointer")}
                      onClick={c.order_count > 0 ? () => setExpandedId(expandedId === c.id ? null : c.id) : undefined}
                    >
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.phone ?? <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.neighborhood ?? <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-center text-sm font-mono">{c.order_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.last_order_date ? fecha(c.last_order_date) : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {c.total_spent > 0 ? ARS.format(c.total_spent) : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {c.order_count > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                              title="Ver pedidos"
                            >
                              <ChevronDown className={cn("w-4 h-4 transition-transform", expandedId === c.id && "rotate-180")} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => { setEditing(c); setFormErrors(null); }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => { setDeleting(c); setDeleteError(null); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === c.id && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={7} className="py-0">
                          <OrdersList cliente={c} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        {filtered.length} de {data.length} clientes
      </p>

      {/* Create dialog */}
      <Dialog open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) setFormErrors(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo cliente</DialogTitle></DialogHeader>
          <ClienteForm onSubmit={handleCreate} errors={formErrors} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button form="cliente-form" type="submit" disabled={isPending} className="gradient-brand text-white border-0">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) { setEditing(null); setFormErrors(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar: {editing?.name}</DialogTitle></DialogHeader>
          {editing && <ClienteForm defaultValues={editing} onSubmit={handleUpdate} errors={formErrors} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button form="cliente-form" type="submit" disabled={isPending} className="gradient-brand text-white border-0">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) { setDeleting(null); setDeleteError(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && deleting.order_count > 0
                ? <>No se puede eliminar <strong>{deleting.name}</strong>: tiene {deleting.order_count} pedido{deleting.order_count !== 1 ? "s" : ""} asociado{deleting.order_count !== 1 ? "s" : ""}.</>
                : <>Vas a eliminar <strong>{deleting?.name}</strong>. Esta acción no se puede deshacer.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{deleting && deleting.order_count > 0 ? "Cerrar" : "Cancelar"}</AlertDialogCancel>
            {deleting && deleting.order_count === 0 && !deleteError && (
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isPending}
              >
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Eliminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

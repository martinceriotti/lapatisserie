"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/lib/actions/suppliers";
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
import { Plus, Pencil, Trash2, Loader2, ChevronRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  default_iva_rate: number;
  parser_type: string | null;
  catalog_count: { count: number }[] | null;
};

type FormErrors = Record<string, string[]>;

function SupplierForm({
  defaultValues,
  onSubmit,
  loading,
  errors,
}: {
  defaultValues?: Partial<Supplier>;
  onSubmit: (fd: FormData) => void;
  loading: boolean;
  errors: FormErrors | null;
}) {
  const [ivaRate, setIvaRate] = useState<string>(
    String(defaultValues?.default_iva_rate ?? 0.21)
  );
  const [parserType, setParserType] = useState<string>(
    defaultValues?.parser_type ?? ""
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("default_iva_rate", ivaRate);
    fd.set("parser_type", parserType);
    onSubmit(fd);
  }

  return (
    <form id="supplier-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="s-name">Nombre *</Label>
        <Input
          id="s-name"
          name="name"
          defaultValue={defaultValues?.name}
          placeholder="Ej: CEPRO, Distribuidora San Martín"
          required
        />
        {errors?.name && (
          <p className="text-xs text-destructive">{errors.name[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="s-phone">Teléfono</Label>
          <Input
            id="s-phone"
            name="phone"
            defaultValue={defaultValues?.phone ?? ""}
            placeholder="0341 000-0000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-email">Email</Label>
          <Input
            id="s-email"
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ""}
            placeholder="ventas@proveedor.com"
          />
          {errors?.email && (
            <p className="text-xs text-destructive">{errors.email[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="s-address">Dirección</Label>
        <Input
          id="s-address"
          name="address"
          defaultValue={defaultValues?.address ?? ""}
          placeholder="Ej: Av. Pellegrini 1234, Rosario"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Formato de lista</Label>
          <Select value={parserType} onValueChange={(v) => { if (v !== null) setParserType(v); }}>
            <SelectTrigger>
              <SelectValue placeholder="Sin formato automático" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin formato automático</SelectItem>
              <SelectItem value="cepro">CEPRO</SelectItem>
              <SelectItem value="drovandi">Drovandi</SelectItem>
              <SelectItem value="lodiser">Lodiser</SelectItem>
              <SelectItem value="pira">PIRA</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Para importar PDFs automáticamente</p>
        </div>
        <div className="space-y-1.5">
          <Label>Tasa de IVA</Label>
          <Select value={ivaRate} onValueChange={(v) => { if (v !== null) setIvaRate(v); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0% (precio final)</SelectItem>
              <SelectItem value="0.105">10.5%</SelectItem>
              <SelectItem value="0.21">21%</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Para calcular precio neto/final</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="s-notes">Notas</Label>
        <Textarea
          id="s-notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          placeholder="Condiciones de pago, días de entrega, contacto…"
          rows={2}
          className="resize-none"
        />
      </div>

      {errors?._ && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {errors._[0]}
        </p>
      )}
    </form>
  );
}

export function SuppliersTable({ initialData }: { initialData: Supplier[] }) {
  const router = useRouter();
  const [data, setData] = useState<Supplier[]>(initialData);
  useEffect(() => { setData(initialData); }, [initialData]);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = useCallback((fd: FormData) => {
    startTransition(async () => {
      const result = await createSupplier(null, fd);
      if ("error" in result) {
        setFormErrors(
          typeof result.error === "string"
            ? { _: [result.error] }
            : (result.error as FormErrors)
        );
        return;
      }
      setOpenForm(false);
      setFormErrors(null);
      router.refresh();
    });
  }, []);

  const handleUpdate = useCallback((fd: FormData) => {
    if (!editing) return;
    startTransition(async () => {
      const result = await updateSupplier(editing.id, null, fd);
      if ("error" in result) {
        setFormErrors(
          typeof result.error === "string"
            ? { _: [result.error] }
            : (result.error as FormErrors)
        );
        return;
      }
      setEditing(null);
      setFormErrors(null);
      router.refresh();
    });
  }, [editing]);

  const handleDelete = useCallback(() => {
    if (!deleting) return;
    startTransition(async () => {
      await deleteSupplier(deleting.id);
      setDeleting(null);
      router.refresh();
    });
  }, [deleting]);

  const getCatalogCount = (s: Supplier) => {
    if (!s.catalog_count || s.catalog_count.length === 0) return 0;
    return s.catalog_count[0].count ?? 0;
  };

  return (
    <>
      <div className="flex justify-end mb-5">
        <Button
          onClick={() => {
            setEditing(null);
            setFormErrors(null);
            setOpenForm(true);
          }}
          className="gradient-brand text-white border-0 hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo proveedor
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-1">No hay proveedores todavía</p>
          <p className="text-sm">Agregá el primero para empezar a cargar sus listas de precios.</p>
        </div>
      ) : (
        <div className="border border-border rounded-2xl overflow-hidden bg-surface">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/50 hover:bg-accent/50">
                <TableHead className="font-medium">Nombre</TableHead>
                <TableHead className="font-medium">Teléfono</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium text-center">Productos</TableHead>
                <TableHead className="font-medium">Estado</TableHead>
                <TableHead className="font-medium text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((s) => (
                <TableRow key={s.id} className={cn(!s.is_active && "opacity-50")}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.phone ?? <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.email ?? <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-mono">{getCatalogCount(s)}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        s.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {s.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/proveedores/${s.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                        >
                          Ver catálogo
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditing(s);
                          setFormErrors(null);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleting(s)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog
        open={openForm}
        onOpenChange={(o) => {
          setOpenForm(o);
          if (!o) setFormErrors(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo proveedor</DialogTitle>
          </DialogHeader>
          <SupplierForm onSubmit={handleCreate} loading={isPending} errors={formErrors} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button form="supplier-form" type="submit" disabled={isPending} className="gradient-brand text-white border-0">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) { setEditing(null); setFormErrors(null); }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar: {editing?.name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <SupplierForm defaultValues={editing} onSubmit={handleUpdate} loading={isPending} errors={formErrors} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button form="supplier-form" type="submit" disabled={isPending} className="gradient-brand text-white border-0">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deleting?.name}</strong> y todo su catálogo de productos.
              Los precios ya aplicados en el historial no se borrarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

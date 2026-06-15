"use client";

import { useState, useTransition, useCallback } from "react";
import {
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  linkCatalogItem,
  applySupplierPrice,
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Link2,
  Link2Off,
  CheckCircle2,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImportPricelist } from "./ImportPricelist";

type RawMaterial = { id: string; name: string; unit: string; current_price: number };

type CatalogItem = {
  id: string;
  supplier_sku: string;
  product_name: string;
  unit_description: string | null;
  price_net: number | null;
  price_final: number;
  conversion_factor: number;
  list_date: string;
  notes: string | null;
  raw_material: RawMaterial | null;
};

type FormErrors = Record<string, string[]>;

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(n);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function CatalogItemForm({
  defaultValues,
  rawMaterials,
  onSubmit,
  errors,
  loading,
}: {
  defaultValues?: Partial<CatalogItem>;
  rawMaterials: RawMaterial[];
  onSubmit: (fd: FormData) => void;
  errors: FormErrors | null;
  loading: boolean;
}) {
  const [linkedId, setLinkedId] = useState<string>(
    defaultValues?.raw_material?.id ?? ""
  );
  const [convFactor, setConvFactor] = useState<string>(
    String(defaultValues?.conversion_factor ?? 1)
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("raw_material_id", linkedId);
    fd.set("conversion_factor", convFactor || "1");
    onSubmit(fd);
  }

  return (
    <form id="catalog-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="ci-sku">Código (SKU) *</Label>
          <Input
            id="ci-sku"
            name="supplier_sku"
            defaultValue={defaultValues?.supplier_sku}
            placeholder="Ej: 50203"
            required
          />
          {errors?.supplier_sku && (
            <p className="text-xs text-destructive">{errors.supplier_sku[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ci-unit">Presentación</Label>
          <Input
            id="ci-unit"
            name="unit_description"
            defaultValue={defaultValues?.unit_description ?? ""}
            placeholder="Ej: x 25 Kg"
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="ci-name">Nombre del producto *</Label>
          <Input
            id="ci-name"
            name="product_name"
            defaultValue={defaultValues?.product_name}
            placeholder="Ej: Harina 0000 x 25 Kg."
            required
          />
          {errors?.product_name && (
            <p className="text-xs text-destructive">{errors.product_name[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ci-price-net">Precio neto</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              id="ci-price-net"
              name="price_net"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues?.price_net ?? ""}
              className="pl-6"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ci-price-final">Precio final *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              id="ci-price-final"
              name="price_final"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues?.price_final ?? ""}
              className="pl-6"
              placeholder="0.00"
              required
            />
          </div>
          {errors?.price_final && (
            <p className="text-xs text-destructive">{errors.price_final[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ci-date">Fecha de lista</Label>
          <Input
            id="ci-date"
            name="list_date"
            type="date"
            defaultValue={
              defaultValues?.list_date ?? new Date().toISOString().split("T")[0]
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ci-conv">Cant. de MP por presentación</Label>
          <Input
            id="ci-conv"
            type="number"
            step="0.001"
            min="0.001"
            value={convFactor}
            onChange={(e) => setConvFactor(e.target.value)}
            placeholder="1"
          />
          <p className="text-xs text-muted-foreground">
            Ej: caja de 10 kg → ingresá 10 (si la MP es por kg).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Vincular a materia prima</Label>
          <Select value={linkedId} onValueChange={(v) => { if (v !== null) setLinkedId(v === "none" ? "" : v); }}>
            <SelectTrigger>
              <SelectValue placeholder="Sin vincular">
                {(v: string | null) => {
                  if (!v || v === "none") return "Sin vincular";
                  const rm = rawMaterials.find((r) => r.id === v);
                  return rm ? `${rm.name} (${rm.unit})` : "Sin vincular";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin vincular</SelectItem>
              {rawMaterials.map((rm) => (
                <SelectItem key={rm.id} value={rm.id}>
                  {rm.name} ({rm.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="ci-notes">Notas</Label>
          <Textarea
            id="ci-notes"
            name="notes"
            defaultValue={defaultValues?.notes ?? ""}
            rows={2}
            className="resize-none"
            placeholder="Observaciones…"
          />
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

export function SupplierCatalogTable({
  supplierId,
  supplierName,
  parserType,
  ivaRate,
  initialData,
  rawMaterials,
}: {
  supplierId: string;
  supplierName: string;
  parserType: string | null;
  ivaRate: number;
  initialData: CatalogItem[];
  rawMaterials: RawMaterial[];
}) {
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [deleting, setDeleting] = useState<CatalogItem | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = initialData.filter(
    (item) =>
      item.product_name.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier_sku.toLowerCase().includes(search.toLowerCase()) ||
      (item.raw_material?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = useCallback((fd: FormData) => {
    startTransition(async () => {
      const result = await createCatalogItem(supplierId, null, fd);
      if ("error" in result) {
        setFormErrors(typeof result.error === "string" ? { _: [result.error] } : (result.error as FormErrors));
        return;
      }
      setOpenForm(false);
      setFormErrors(null);
      window.location.reload();
    });
  }, [supplierId]);

  const handleUpdate = useCallback((fd: FormData) => {
    if (!editing) return;
    startTransition(async () => {
      const result = await updateCatalogItem(editing.id, supplierId, null, fd);
      if ("error" in result) {
        setFormErrors(typeof result.error === "string" ? { _: [result.error] } : (result.error as FormErrors));
        return;
      }
      setEditing(null);
      setFormErrors(null);
      window.location.reload();
    });
  }, [editing, supplierId]);

  const handleDelete = useCallback(() => {
    if (!deleting) return;
    startTransition(async () => {
      await deleteCatalogItem(deleting.id, supplierId);
      setDeleting(null);
      window.location.reload();
    });
  }, [deleting, supplierId]);

  const handleApplyPrice = useCallback((item: CatalogItem) => {
    if (!item.raw_material) return;
    setApplyingId(item.id);
    startTransition(async () => {
      const effectivePrice = item.price_final / (item.conversion_factor || 1);
      const result = await applySupplierPrice(
        item.raw_material!.id,
        supplierId,
        effectivePrice,
        `Precio de ${supplierName} — lista ${formatDate(item.list_date)}`
      );
      setApplyingId(null);
      if ("error" in result) {
        alert(typeof result.error === "string" ? result.error : "Error al actualizar precio");
        return;
      }
      window.location.reload();
    });
  }, [supplierId, supplierName]);

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, nombre o materia prima…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ImportPricelist
          supplierId={supplierId}
          supplierName={supplierName}
          parserType={parserType}
          ivaRate={ivaRate}
          existingSkus={new Set(initialData.map((i) => i.supplier_sku))}
        />
        <Button
          onClick={() => {
            setEditing(null);
            setFormErrors(null);
            setOpenForm(true);
          }}
          className="gradient-brand text-white border-0 hover:opacity-90 shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar producto
        </Button>
      </div>

      {filtered.length === 0 && initialData.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <p className="font-medium mb-1">Catálogo vacío</p>
          <p className="text-sm">Agregá los productos de este proveedor manualmente, o importá una lista de precios.</p>
        </div>
      ) : (
        <div className="border border-border rounded-2xl overflow-hidden bg-surface">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/50 hover:bg-accent/50">
                <TableHead className="font-medium w-24">SKU</TableHead>
                <TableHead className="font-medium">Producto</TableHead>
                <TableHead className="font-medium">Presentación</TableHead>
                <TableHead className="font-medium text-right">Precio final</TableHead>
                <TableHead className="font-medium">Lista</TableHead>
                <TableHead className="font-medium">Materia prima vinculada</TableHead>
                <TableHead className="font-medium text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    Sin resultados para esa búsqueda.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((item) => {
                const effectivePrice = item.price_final / (item.conversion_factor || 1);
                const isApplied =
                  item.raw_material &&
                  Math.abs(effectivePrice - item.raw_material.current_price) < 0.01;

                return (
                  <TableRow
                    key={item.id}
                    className={cn(applyingId === item.id && "opacity-60 pointer-events-none")}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.supplier_sku}
                    </TableCell>
                    <TableCell className="font-medium text-sm max-w-[220px] truncate">
                      {item.product_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.unit_description ?? <span className="opacity-40">—</span>}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {applyingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto" />
                      ) : (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-mono font-semibold">
                            {formatPrice(item.price_final)}
                          </span>
                          {item.conversion_factor > 1 && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatPrice(item.price_final / item.conversion_factor)}/u
                              <span className="ml-1 opacity-60">÷{item.conversion_factor}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(item.list_date)}
                    </TableCell>
                    <TableCell>
                      {item.raw_material ? (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Link2 className="w-3 h-3" />
                          {item.raw_material.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 flex items-center gap-1">
                          <Link2Off className="w-3 h-3" />
                          Sin vincular
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.raw_material && (
                          isApplied ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium mr-2">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Precio activo
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs mr-1"
                              onClick={() => handleApplyPrice(item)}
                            >
                              Aplicar precio
                            </Button>
                          )
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditing(item);
                            setFormErrors(null);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleting(item)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        {filtered.length} de {initialData.length} productos en el catálogo
      </p>

      {/* Create dialog */}
      <Dialog open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) setFormErrors(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar producto al catálogo</DialogTitle>
          </DialogHeader>
          <CatalogItemForm
            rawMaterials={rawMaterials}
            onSubmit={handleCreate}
            errors={formErrors}
            loading={isPending}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button form="catalog-form" type="submit" disabled={isPending} className="gradient-brand text-white border-0">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) { setEditing(null); setFormErrors(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
          </DialogHeader>
          {editing && (
            <CatalogItemForm
              defaultValues={editing}
              rawMaterials={rawMaterials}
              onSubmit={handleUpdate}
              errors={formErrors}
              loading={isPending}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button form="catalog-form" type="submit" disabled={isPending} className="gradient-brand text-white border-0">
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
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deleting?.product_name}</strong> del catálogo.
              No afecta los precios ya aplicados.
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

"use client";

import { useState, useTransition, useCallback } from "react";
import {
  createMateriaPrima,
  updateMateriaPrima,
  deleteMateriaPrima,
} from "@/lib/actions/materias-primas";
import {
  UNITS,
  CATEGORIES,
  CATEGORY_LABELS,
  UNIT_LABELS,
} from "@/lib/constants/materias-primas";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Pencil, Trash2, ChevronDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PriceHistory = {
  id: string;
  price: number;
  effective_date: string;
  notes: string | null;
};

type MateriaPrima = {
  id: string;
  name: string;
  description: string | null;
  unit: typeof UNITS[number];
  category: typeof CATEGORIES[number];
  current_price: number;
  price_per_gram: number;
  supplier: string | null;
  is_active: boolean;
  price_history: PriceHistory[];
};

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

type FormErrors = Record<string, string[]>;

function MateriaPrimaForm({
  defaultValues,
  onSubmit,
  loading,
  errors,
}: {
  defaultValues?: Partial<MateriaPrima>;
  onSubmit: (fd: FormData) => void;
  loading: boolean;
  errors: FormErrors | null;
}) {
  const [unit, setUnit] = useState<string>(defaultValues?.unit ?? "g");
  const [category, setCategory] = useState<string>(defaultValues?.category ?? "other");

  const handleUnitChange = (v: string | null) => { if (v) setUnit(v); };
  const handleCategoryChange = (v: string | null) => { if (v) setCategory(v); };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("unit", unit);
    fd.set("category", category);
    onSubmit(fd);
  }

  return (
    <form id="materia-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultValues?.name}
            placeholder="Ej: Harina 0000"
            required
          />
          {errors?.name && (
            <p className="text-xs text-destructive">{errors.name[0]}</p>
          )}
        </div>

        {/* Precio */}
        <div className="space-y-1.5">
          <Label htmlFor="current_price">Precio *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <Input
              id="current_price"
              name="current_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues?.current_price ?? ""}
              className="pl-6"
              placeholder="0.00"
              required
            />
          </div>
          {errors?.current_price && (
            <p className="text-xs text-destructive">{errors.current_price[0]}</p>
          )}
        </div>

        {/* Unidad */}
        <div className="space-y-1.5">
          <Label>Unidad *</Label>
          <Select value={unit} onValueChange={handleUnitChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {UNIT_LABELS[u]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categoría */}
        <div className="space-y-1.5">
          <Label>Categoría *</Label>
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Proveedor */}
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="supplier">Proveedor (opcional)</Label>
          <Input
            id="supplier"
            name="supplier"
            defaultValue={defaultValues?.supplier ?? ""}
            placeholder="Ej: Distribuidora San Martín"
          />
        </div>

        {/* Descripción */}
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="description">Notas (opcional)</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={defaultValues?.description ?? ""}
            placeholder="Marca, calidad, detalles adicionales…"
            rows={2}
            className="resize-none"
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

export function MateriasTable({ initialData }: { initialData: MateriaPrima[] }) {
  const [data, setData] = useState<MateriaPrima[]>(initialData);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<MateriaPrima | null>(null);
  const [deleting, setDeleting] = useState<MateriaPrima | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = data.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || m.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleCreate = useCallback(
    (fd: FormData) => {
      startTransition(async () => {
        const result = await createMateriaPrima(null, fd);
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
        // Refresh data by re-fetching (optimistic update not needed, page revalidates)
        window.location.reload();
      });
    },
    []
  );

  const handleUpdate = useCallback(
    (fd: FormData) => {
      if (!editing) return;
      startTransition(async () => {
        const result = await updateMateriaPrima(editing.id, null, fd);
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
        window.location.reload();
      });
    },
    [editing]
  );

  const handleDelete = useCallback(() => {
    if (!deleting) return;
    startTransition(async () => {
      await deleteMateriaPrima(deleting.id);
      setDeleting(null);
      window.location.reload();
    });
  }, [deleting]);

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar insumo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { if (v) setCategoryFilter(v); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setEditing(null);
            setFormErrors(null);
            setOpenForm(true);
          }}
          className="gradient-brand text-white border-0 hover:opacity-90 shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva materia prima
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-accent/50 hover:bg-accent/50">
              <TableHead className="font-medium">Nombre</TableHead>
              <TableHead className="font-medium">Proveedor</TableHead>
              <TableHead className="font-medium">Categoría</TableHead>
              <TableHead className="font-medium text-right">Precio</TableHead>
              <TableHead className="font-medium text-right">$/g</TableHead>
              <TableHead className="font-medium">Unidad</TableHead>
              <TableHead className="font-medium">Estado</TableHead>
              <TableHead className="font-medium text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  {search || categoryFilter !== "all"
                    ? "No se encontraron resultados."
                    : "Todavía no hay materias primas. Agregá la primera."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((m) => (
              <>
                <TableRow
                  key={m.id}
                  className={cn(!m.is_active && "opacity-50")}
                >
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.supplier ?? <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_LABELS[m.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatPrice(m.current_price)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {m.price_per_gram != null
                      ? `$${Number(m.price_per_gram).toFixed(4)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{m.unit}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        m.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {m.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {m.price_history?.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            setExpandedHistory(
                              expandedHistory === m.id ? null : m.id
                            )
                          }
                          title="Ver historial de precios"
                        >
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform",
                              expandedHistory === m.id && "rotate-180"
                            )}
                          />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditing(m);
                          setFormErrors(null);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleting(m)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Price history row */}
                {expandedHistory === m.id && m.price_history?.length > 0 && (
                  <TableRow key={`${m.id}-history`} className="bg-muted/30">
                    <TableCell colSpan={8} className="py-0">
                      <div className="px-4 py-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Historial de precios
                        </p>
                        <div className="space-y-1">
                          {[...m.price_history]
                            .sort(
                              (a, b) =>
                                new Date(b.effective_date).getTime() -
                                new Date(a.effective_date).getTime()
                            )
                            .slice(0, 8)
                            .map((h) => (
                              <div
                                key={h.id}
                                className="flex items-center gap-4 text-sm"
                              >
                                <span className="text-muted-foreground w-24">
                                  {formatDate(h.effective_date)}
                                </span>
                                <span className="font-mono font-medium">
                                  {formatPrice(h.price)}
                                </span>
                                {h.notes && (
                                  <span className="text-muted-foreground text-xs">
                                    {h.notes}
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        {filtered.length} de {data.length} insumos
      </p>

      {/* Create dialog */}
      <Dialog
        open={openForm}
        onOpenChange={(o) => {
          setOpenForm(o);
          if (!o) setFormErrors(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva materia prima</DialogTitle>
          </DialogHeader>
          <MateriaPrimaForm
            onSubmit={handleCreate}
            loading={isPending}
            errors={formErrors}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Cancelar
            </Button>
            <Button
              form="materia-form"
              type="submit"
              disabled={isPending}
              className="gradient-brand text-white border-0"
            >
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
          if (!o) {
            setEditing(null);
            setFormErrors(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar: {editing?.name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <MateriaPrimaForm
              defaultValues={editing}
              onSubmit={handleUpdate}
              loading={isPending}
              errors={formErrors}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              form="materia-form"
              type="submit"
              disabled={isPending}
              className="gradient-brand text-white border-0"
            >
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
            <AlertDialogTitle>¿Eliminar insumo?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deleting?.name}</strong>. Esta acción no
              se puede deshacer. Si el insumo está en uso en alguna receta, no
              podrá eliminarse.
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

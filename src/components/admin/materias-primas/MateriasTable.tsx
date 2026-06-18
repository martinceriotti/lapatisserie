"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  createMateriaPrima,
  updateMateriaPrima,
  deleteMateriaPrima,
  syncIntermediatePrice,
  type RecipeOption,
} from "@/lib/actions/materias-primas";
import { applySupplierPrice } from "@/lib/actions/suppliers";
import {
  UNITS,
  CATEGORIES,
  CATEGORY_LABELS,
  UNIT_LABELS,
  MATERIAL_TYPES,
  MATERIAL_TYPE_LABELS,
  INGREDIENT_CATEGORIES,
  PRODUCT_CATEGORIES,
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
import { Plus, Pencil, Trash2, ChevronDown, Search, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Supplier = { id: string; name: string };

type PriceHistory = {
  id: string;
  price: number;
  effective_date: string;
  notes: string | null;
  supplier: Supplier | null;
};

type SupplierOffer = {
  id: string;
  supplier_sku: string;
  product_name: string;
  price_final: number;
  price_net: number | null;
  conversion_factor: number;
  unit_description: string | null;
  list_date: string;
  supplier: Supplier | null;
};

type MateriaPrima = {
  id: string;
  name: string;
  description: string | null;
  unit: typeof UNITS[number];
  category: typeof CATEGORIES[number];
  material_type: typeof MATERIAL_TYPES[number];
  recipe_id: string | null;
  current_price: number;
  sale_price: number | null;
  price_per_gram: number;
  is_active: boolean;
  price_history: PriceHistory[];
  supplier_offers: SupplierOffer[];
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
  recipes,
  onSubmit,
  loading,
  errors,
}: {
  defaultValues?: Partial<MateriaPrima>;
  recipes: RecipeOption[];
  onSubmit: (fd: FormData) => void;
  loading: boolean;
  errors: FormErrors | null;
}) {
  const [unit, setUnit] = useState<string>(defaultValues?.unit ?? "g");
  const [category, setCategory] = useState<string>(defaultValues?.category ?? "other");
  const [materialType, setMaterialType] = useState<string>(defaultValues?.material_type ?? "materia_prima");
  const [recipeId, setRecipeId] = useState<string>(defaultValues?.recipe_id ?? "");

  const visibleCategories = materialType === "producto_terminado" ? PRODUCT_CATEGORIES : INGREDIENT_CATEGORIES;

  const handleUnitChange = (v: string | null) => { if (v) setUnit(v); };
  const handleCategoryChange = (v: string | null) => { if (v) setCategory(v); };
  const handleMaterialTypeChange = (v: string | null) => {
    if (!v) return;
    setMaterialType(v);
    if (v === "producto_terminado" && (INGREDIENT_CATEGORIES as readonly string[]).includes(category) && category !== "other") {
      setCategory("otros_productos");
    } else if (v !== "producto_terminado" && (PRODUCT_CATEGORIES as readonly string[]).includes(category)) {
      setCategory("other");
    }
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("unit", unit);
    fd.set("category", category);
    fd.set("material_type", materialType);
    fd.set("recipe_id", recipeId);
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
              <SelectValue>
                {(v: string | null) => UNIT_LABELS[v as keyof typeof UNIT_LABELS] ?? v ?? "—"}
              </SelectValue>
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
              <SelectValue>
                {(v: string | null) => CATEGORY_LABELS[v as keyof typeof CATEGORY_LABELS] ?? v ?? "—"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {visibleCategories.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
              {materialType === "producto_terminado" && (
                <SelectItem value="other">{CATEGORY_LABELS["other"]}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de material */}
        <div className="col-span-2 space-y-1.5">
          <Label>Tipo *</Label>
          <Select value={materialType} onValueChange={handleMaterialTypeChange}>
            <SelectTrigger>
              <SelectValue>
                {(v: string | null) => MATERIAL_TYPE_LABELS[v as keyof typeof MATERIAL_TYPE_LABELS] ?? v ?? "—"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {MATERIAL_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Intermedio = elaboración propia (tapas, masa, relleno). Producto terminado = listo para vender.
          </p>
        </div>

        {/* Precio de venta — solo para producto terminado */}
        {materialType === "producto_terminado" && (
          <div className="space-y-1.5">
            <Label htmlFor="sale_price">Precio de venta</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="sale_price"
                name="sale_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={defaultValues?.sale_price ?? ""}
                className="pl-6"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {/* Receta vinculada — solo para no-materia_prima */}
        {materialType !== "materia_prima" && (
          <div className="col-span-2 space-y-1.5">
            <Label>Receta vinculada</Label>
            <Select value={recipeId} onValueChange={(v) => setRecipeId(v ?? "")}>
              <SelectTrigger className="overflow-hidden">
                <SelectValue>
                  {(v: string | null) => {
                    if (!v) return "Sin receta";
                    const r = recipes.find((r) => r.id === v);
                    return (
                      <span className="truncate block">
                        {r ? r.name : "Sin receta"}
                      </span>
                    );
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin receta</SelectItem>
                {recipes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} — rinde {r.yield_quantity} {r.yield_unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Con receta vinculada podés sincronizar el precio desde el costo calculado.
            </p>
          </div>
        )}

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

function ExpandedRow({ m, onApplyPrice }: {
  m: MateriaPrima;
  onApplyPrice: (supplierId: string, price: number, supplierName: string) => void;
}) {
  const hasOffers = m.supplier_offers?.length > 0;
  const hasHistory = m.price_history?.length > 0;

  if (!hasOffers && !hasHistory) return null;

  const sortedHistory = [...(m.price_history ?? [])]
    .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())
    .slice(0, 8);

  const sortedOffers = [...(m.supplier_offers ?? [])]
    .sort((a, b) =>
      (a.price_final / (a.conversion_factor || 1)) - (b.price_final / (b.conversion_factor || 1))
    );

  return (
    <TableRow className="bg-muted/20 hover:bg-muted/20">
      <TableCell colSpan={8} className="py-0">
        <div className="px-4 py-4 space-y-4">
          {/* Supplier offers */}
          {hasOffers && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Precios por proveedor
              </p>
              <div className="space-y-1.5">
                {sortedOffers.map((offer, i) => {
                  const factor = offer.conversion_factor || 1;
                  const effectivePrice = offer.price_final / factor;
                  const isCheapest = i === 0 && sortedOffers.length > 1;
                  const isActive = Math.abs(effectivePrice - m.current_price) < 0.01;
                  return (
                    <div
                      key={offer.id}
                      className={cn(
                        "flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg",
                        isCheapest && "bg-emerald-50 border border-emerald-100",
                        isActive && !isCheapest && "bg-accent/50"
                      )}
                    >
                      <span className="font-medium w-36 truncate">
                        {offer.supplier?.name ?? "Proveedor"}
                      </span>
                      <span
                        className="text-muted-foreground text-xs flex-1 truncate"
                        title={offer.product_name}
                      >
                        {offer.product_name}
                      </span>
                      {offer.unit_description && (
                        <span className="text-muted-foreground text-xs w-20">
                          {offer.unit_description}
                        </span>
                      )}
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-semibold">
                          {formatPrice(effectivePrice)}
                        </span>
                        {factor > 1 && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {formatPrice(offer.price_final)} ÷{factor}
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        Lista: {formatDate(offer.list_date)}
                      </span>
                      {isCheapest && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                          Más barato
                        </Badge>
                      )}
                      {isActive ? (
                        <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Precio activo
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-auto h-7 text-xs"
                          onClick={() => onApplyPrice(
                            offer.supplier!.id,
                            effectivePrice,
                            offer.supplier!.name
                          )}
                          disabled={!offer.supplier}
                        >
                          Usar este precio
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price history */}
          {hasHistory && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Historial de precios
              </p>
              <div className="space-y-1">
                {sortedHistory.map((h) => (
                  <div key={h.id} className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground w-24">
                      {formatDate(h.effective_date)}
                    </span>
                    <span className="font-mono font-medium">
                      {formatPrice(h.price)}
                    </span>
                    {h.supplier && (
                      <span className="text-muted-foreground text-xs">
                        {h.supplier.name}
                      </span>
                    )}
                    {h.notes && (
                      <span className="text-muted-foreground text-xs">
                        {h.notes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function MateriasTable({ initialData, recipes }: { initialData: MateriaPrima[]; recipes: RecipeOption[] }) {
  const router = useRouter();
  const [data, setData] = useState<MateriaPrima[]>(initialData);
  useEffect(() => { setData(initialData); }, [initialData]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<MateriaPrima | null>(null);
  const [deleting, setDeleting] = useState<MateriaPrima | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applyingPrice, setApplyingPrice] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = data.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || m.category === categoryFilter;
    const matchType = typeFilter === "all" || m.material_type === typeFilter;
    return matchSearch && matchCat && matchType;
  });

  const hasExpandableContent = (m: MateriaPrima) =>
    (m.price_history?.length ?? 0) > 0 || (m.supplier_offers?.length ?? 0) > 0;

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
        router.refresh();
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
        router.refresh();
      });
    },
    [editing]
  );

  const handleDelete = useCallback(() => {
    if (!deleting) return;
    startTransition(async () => {
      await deleteMateriaPrima(deleting.id);
      setDeleting(null);
      router.refresh();
    });
  }, [deleting]);

  const handleApplyPrice = useCallback(
    (materiaPrimaId: string, supplierId: string, price: number, supplierName: string) => {
      setApplyingPrice(materiaPrimaId);
      startTransition(async () => {
        const result = await applySupplierPrice(
          materiaPrimaId,
          supplierId,
          price,
          `Precio de ${supplierName}`
        );
        setApplyingPrice(null);
        if ("error" in result) {
          alert(typeof result.error === "string" ? result.error : "Error al actualizar precio");
          return;
        }
        router.refresh();
      });
    },
    []
  );

  const handleSync = useCallback((id: string) => {
    setSyncing(id);
    startTransition(async () => {
      const result = await syncIntermediatePrice(id);
      setSyncing(null);
      if ("error" in result) {
        alert(typeof result.error === "string" ? result.error : "Error al sincronizar precio");
        return;
      }
      router.refresh();
    });
  }, []);

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
        <Select value={typeFilter} onValueChange={(v) => { if (v) setTypeFilter(v); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos los tipos">
              {(v: string | null) =>
                !v || v === "all"
                  ? "Todos los tipos"
                  : (MATERIAL_TYPE_LABELS[v as keyof typeof MATERIAL_TYPE_LABELS] ?? v)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {MATERIAL_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {MATERIAL_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => { if (v) setCategoryFilter(v); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las categorías">
              {(v: string | null) =>
                !v || v === "all"
                  ? "Todas las categorías"
                  : (CATEGORY_LABELS[v as keyof typeof CATEGORY_LABELS] ?? v)
              }
            </SelectValue>
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
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <div className="min-w-[700px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-accent/50 hover:bg-accent/50">
              <TableHead className="font-medium">Nombre</TableHead>
              <TableHead className="font-medium">Proveedor activo</TableHead>
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
            {filtered.map((m) => {
              const lastSupplier = m.price_history
                ?.filter((h) => h.supplier)
                .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())[0]
                ?.supplier;

              return (
                <>
                  <TableRow
                    key={m.id}
                    className={cn(
                      !m.is_active && "opacity-50",
                      applyingPrice === m.id && "opacity-60 pointer-events-none"
                    )}
                  >
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lastSupplier
                        ? <span className="text-foreground/80">{lastSupplier.name}</span>
                        : <span className="text-muted-foreground/40">—</span>
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-xs w-fit">
                          {CATEGORY_LABELS[m.category]}
                        </Badge>
                        {m.material_type !== "materia_prima" && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs w-fit",
                              m.material_type === "intermedio"
                                ? "border-amber-300 text-amber-700 bg-amber-50"
                                : "border-violet-300 text-violet-700 bg-violet-50"
                            )}
                          >
                            {MATERIAL_TYPE_LABELS[m.material_type]}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="text-right">
                          {applyingPrice === m.id || syncing === m.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <span>{formatPrice(m.current_price)}</span>
                          }
                          {m.material_type === "producto_terminado" && m.sale_price != null && (
                            <p className="text-xs text-muted-foreground font-normal">
                              Venta: {formatPrice(m.sale_price)}
                            </p>
                          )}
                        </div>
                        {m.recipe_id && m.material_type !== "materia_prima" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                            onClick={() => handleSync(m.id)}
                            disabled={syncing === m.id}
                            title="Sincronizar precio desde receta"
                          >
                            <RefreshCw className={cn("w-3 h-3", syncing === m.id && "animate-spin")} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {["g", "kg", "ml", "l"].includes(m.unit) && m.price_per_gram != null
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
                        {hasExpandableContent(m) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                            title="Ver precios y historial"
                          >
                            <ChevronDown
                              className={cn(
                                "w-4 h-4 transition-transform",
                                expandedId === m.id && "rotate-180"
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

                  {expandedId === m.id && (
                    <ExpandedRow
                      key={`${m.id}-expanded`}
                      m={m}
                      onApplyPrice={(supplierId, price, supplierName) =>
                        handleApplyPrice(m.id, supplierId, price, supplierName)
                      }
                    />
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
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
            recipes={recipes}
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
              recipes={recipes}
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

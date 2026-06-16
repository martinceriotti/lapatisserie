"use client";

import { useState, useTransition, useCallback } from "react";
import {
  createProduct,
  updateProduct,
  toggleProduct,
  deleteProduct,
  type ProductWithCost,
  type ProductCategory,
  type RecipeOption,
  type ActionResult,
} from "@/lib/actions/productos";
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
import { Plus, Pencil, Trash2, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const TYPE_LABELS = {
  receta_completa: "Completa",
  porcion: "Porción",
} as const;

const PRICE_DISPLAY_LABELS = {
  fixed: "Precio fijo",
  from: "Desde",
  consult: "Consultar",
} as const;

type FormErrors = Record<string, string[]>;

function getCalculatedCost(product: ProductWithCost): number | null {
  if (!product.cost) return null;
  if (product.type === "receta_completa") return product.cost.total_cost;
  return product.cost.cost_per_unit * product.portion_qty;
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

function ProductForm({
  defaultValues,
  categories,
  recipes,
  onSubmit,
  loading,
  errors,
}: {
  defaultValues?: Partial<ProductWithCost>;
  categories: ProductCategory[];
  recipes: RecipeOption[];
  onSubmit: (fd: FormData) => void;
  loading: boolean;
  errors: FormErrors | null;
}) {
  const [type, setType] = useState(defaultValues?.type ?? "receta_completa");
  const [priceDisplay, setPriceDisplay] = useState(defaultValues?.price_display ?? "consult");
  const [categoryId, setCategoryId] = useState(defaultValues?.category_id ?? "");
  const [recipeId, setRecipeId] = useState(defaultValues?.recipe_id ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("type", type);
    fd.set("price_display", priceDisplay);
    fd.set("category_id", categoryId);
    fd.set("recipe_id", recipeId);
    fd.set("is_featured", fd.has("is_featured") ? "true" : "false");
    onSubmit(fd);
  }

  return (
    <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div className="space-y-1.5">
        <Label htmlFor="p-name">Nombre</Label>
        <Input
          id="p-name"
          name="name"
          defaultValue={defaultValues?.name}
          placeholder="Ej: Torta Red Velvet entera"
          required
        />
        {errors?.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
      </div>

      {/* Tipo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => v && setType(v as typeof type)}>
            <SelectTrigger>
              <SelectValue>
                {(v: string | null) => v ? TYPE_LABELS[v as keyof typeof TYPE_LABELS] : "—"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receta_completa">Receta completa</SelectItem>
              <SelectItem value="porcion">Porción</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type === "porcion" && (
          <div className="space-y-1.5">
            <Label htmlFor="p-qty">Cantidad de porciones</Label>
            <Input
              id="p-qty"
              name="portion_qty"
              type="number"
              step="0.5"
              min="0.5"
              defaultValue={defaultValues?.portion_qty ?? 1}
              required
            />
            {errors?.portion_qty && <p className="text-xs text-destructive">{errors.portion_qty[0]}</p>}
          </div>
        )}
        {type === "receta_completa" && (
          <input type="hidden" name="portion_qty" value="1" />
        )}
      </div>

      {/* Receta */}
      <div className="space-y-1.5">
        <Label>Receta vinculada</Label>
        <Select value={recipeId} onValueChange={(v) => setRecipeId(v ?? "")}>
          <SelectTrigger>
            <SelectValue>
              {(v: string | null) => {
                if (!v) return "Sin vincular";
                return recipes.find((r) => r.id === v)?.name ?? "Sin vincular";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sin vincular</SelectItem>
            {recipes.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Vinculando una receta el costo se calcula automáticamente.
        </p>
      </div>

      {/* Descripción corta */}
      <div className="space-y-1.5">
        <Label htmlFor="p-desc">Descripción corta</Label>
        <Textarea
          id="p-desc"
          name="short_description"
          defaultValue={defaultValues?.short_description ?? ""}
          placeholder="Una línea descriptiva para la web..."
          rows={2}
          className="resize-none"
        />
      </div>

      {/* Categoría + Cantidad mínima */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
            <SelectTrigger>
              <SelectValue>
                {(v: string | null) => {
                  if (!v) return "Sin categoría";
                  return categories.find((c) => c.id === v)?.name ?? "Sin categoría";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin categoría</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="p-min">Cantidad mínima</Label>
          <Input
            id="p-min"
            name="min_order_qty"
            type="number"
            min="1"
            step="1"
            defaultValue={defaultValues?.min_order_qty ?? 1}
          />
        </div>
      </div>

      {/* Precio */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Modo de precio</Label>
          <Select value={priceDisplay} onValueChange={(v) => v && setPriceDisplay(v as typeof priceDisplay)}>
            <SelectTrigger>
              <SelectValue>
                {(v: string | null) => v ? PRICE_DISPLAY_LABELS[v as keyof typeof PRICE_DISPLAY_LABELS] : "—"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consult">Consultar</SelectItem>
              <SelectItem value="fixed">Precio fijo</SelectItem>
              <SelectItem value="from">Desde $...</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {priceDisplay !== "consult" && (
          <div className="space-y-1.5">
            <Label htmlFor="p-price">
              {priceDisplay === "from" ? "Precio desde" : "Precio"}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="p-price"
                name="base_price"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={defaultValues?.base_price ?? ""}
                placeholder="0"
                className="pl-7"
              />
            </div>
            {errors?.base_price && <p className="text-xs text-destructive">{errors.base_price[0]}</p>}
          </div>
        )}
        {priceDisplay === "consult" && (
          <input type="hidden" name="base_price" value="" />
        )}
      </div>

      {/* Destacado */}
      <div className="flex items-center gap-2">
        <input
          id="p-featured"
          name="is_featured"
          type="checkbox"
          defaultChecked={defaultValues?.is_featured ?? false}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <Label htmlFor="p-featured" className="cursor-pointer">
          Destacar en la web
        </Label>
      </div>

      {errors?._ && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {errors._[0]}
        </p>
      )}
    </form>
  );
}

export function ProductosList({
  initialData,
  categories,
  recipes,
  salePriceFactor,
}: {
  initialData: ProductWithCost[];
  categories: ProductCategory[];
  recipes: RecipeOption[];
  salePriceFactor: number;
}) {
  const [products, setProducts] = useState(initialData);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<ProductWithCost | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = useCallback((fd: FormData) => {
    startTransition(async () => {
      const result = await createProduct(null, fd);
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
      const result = await updateProduct(editing.id, null, fd);
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

  const handleToggle = useCallback(
    (id: string, field: "is_active" | "is_featured", current: boolean) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: !current } : p))
      );
      startTransition(async () => {
        const result = await toggleProduct(id, field, !current);
        if ("error" in result) window.location.reload();
      });
    },
    []
  );

  const handleDelete = useCallback((id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    startTransition(async () => {
      await deleteProduct(id);
      window.location.reload();
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => { setFormErrors(null); setOpenCreate(true); }}
          className="gradient-brand text-white border-0 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground text-sm">Sin productos todavía.</p>
          <p className="text-muted-foreground text-xs mt-1">
            Creá el primero con el botón de arriba.
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Receta</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Costo</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Precio</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Dest.</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Activo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => {
                const cost = getCalculatedCost(p);
                const suggestedPrice = cost ? cost * salePriceFactor : null;
                const displayPrice = p.base_price ?? suggestedPrice;

                return (
                  <tr
                    key={p.id}
                    className={cn("hover:bg-muted/20 transition-colors", !p.is_active && "opacity-50")}
                  >
                    {/* Producto */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{p.name}</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-xs py-0 px-1.5 h-4">
                            {TYPE_LABELS[p.type]}
                            {p.type === "porcion" && p.portion_qty !== 1 && ` ×${p.portion_qty}`}
                          </Badge>
                          {p.category && (
                            <span className="text-xs text-muted-foreground">{p.category.name}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Receta */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.recipe ? (
                        <span className="text-xs">{p.recipe.name}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>

                    {/* Costo */}
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {cost != null ? (
                        <span className="text-muted-foreground">{ARS.format(cost)}</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Precio */}
                    <td className="px-4 py-3 text-right">
                      {p.price_display === "consult" ? (
                        <span className="text-xs text-muted-foreground">Consultar</span>
                      ) : displayPrice != null ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-mono font-semibold text-primary text-sm">
                            {p.price_display === "from" ? "desde " : ""}
                            {ARS.format(displayPrice)}
                          </span>
                          {!p.base_price && cost != null && (
                            <span className="text-xs text-muted-foreground/60">sugerido</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Destacado */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(p.id, "is_featured", p.is_featured)}
                        disabled={isPending}
                        title={p.is_featured ? "Quitar destacado" : "Destacar"}
                      >
                        <Star
                          className={cn(
                            "w-4 h-4 mx-auto transition-colors",
                            p.is_featured
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30 hover:text-amber-300"
                          )}
                        />
                      </button>
                    </td>

                    {/* Activo */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          checked={p.is_active}
                          onChange={() => handleToggle(p.id, "is_active", p.is_active)}
                          disabled={isPending}
                        />
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => { setFormErrors(null); setEditing(p); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(p.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={openCreate} onOpenChange={(o) => { setOpenCreate(o); if (!o) setFormErrors(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo producto</DialogTitle>
          </DialogHeader>
          <ProductForm
            categories={categories}
            recipes={recipes}
            onSubmit={handleCreate}
            loading={isPending}
            errors={formErrors}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
            <Button form="product-form" type="submit" disabled={isPending} className="gradient-brand text-white border-0">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear
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
            <ProductForm
              defaultValues={editing}
              categories={categories}
              recipes={recipes}
              onSubmit={handleUpdate}
              loading={isPending}
              errors={formErrors}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button form="product-form" type="submit" disabled={isPending} className="gradient-brand text-white border-0">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

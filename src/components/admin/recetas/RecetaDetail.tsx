"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  updateRecipe,
  upsertIngredient,
  removeIngredient,
  type RecipeDetail,
  type RecipeCategory,
  type ActionResult,
} from "@/lib/actions/recetas";
import {
  RECIPE_YIELD_UNITS,
  RECIPE_DIFFICULTIES,
  YIELD_UNIT_LABELS,
  DIFFICULTY_LABELS,
  RECIPE_UNIT_LABELS,
  toRecipeUnit,
} from "@/lib/constants/recetas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  BookOpen,
  Clock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RawMaterial = {
  id: string;
  name: string;
  unit: string;
  current_price: number;
  price_per_gram: number | null;
};

type Props = {
  recipe: RecipeDetail;
  categories: RecipeCategory[];
  rawMaterials: RawMaterial[];
  salePriceFactor: number;
};

type FormErrors = Record<string, string[]>;

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(n);
}

function RecetaForm({
  categories,
  defaultValues,
  onSubmit,
  loading,
  errors,
}: {
  categories: RecipeCategory[];
  defaultValues: RecipeDetail;
  onSubmit: (fd: FormData) => void;
  loading: boolean;
  errors: FormErrors | null;
}) {
  const [categoryId, setCategoryId] = useState(defaultValues.category_id ?? "");
  const [yieldUnit, setYieldUnit] = useState(defaultValues.yield_unit ?? "unidades");
  const [difficulty, setDifficulty] = useState(defaultValues.difficulty ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("category_id", categoryId);
    fd.set("yield_unit", yieldUnit);
    fd.set("difficulty", difficulty);
    onSubmit(fd);
  }

  return (
    <form id="receta-edit-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="edit-name">Nombre *</Label>
          <Input id="edit-name" name="name" defaultValue={defaultValues.name} required />
          {errors?.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Sin categoría">
                {(v: string | null) =>
                  !v ? "Sin categoría" : (categories.find((c) => c.id === v)?.name ?? "Sin categoría")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin categoría</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Dificultad</Label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Sin especificar">
                {(v: string | null) => !v ? "Sin especificar" : DIFFICULTY_LABELS[v] ?? v}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin especificar</SelectItem>
              {RECIPE_DIFFICULTIES.map((d) => (
                <SelectItem key={d} value={d}>{DIFFICULTY_LABELS[d]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-yield">Rendimiento *</Label>
          <Input
            id="edit-yield"
            name="yield_quantity"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={defaultValues.yield_quantity}
            required
          />
          {errors?.yield_quantity && (
            <p className="text-xs text-destructive">{errors.yield_quantity[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Unidad de rendimiento *</Label>
          <Select value={yieldUnit} onValueChange={(v) => v && setYieldUnit(v)}>
            <SelectTrigger>
              <SelectValue>
                {(v: string | null) => YIELD_UNIT_LABELS[v ?? ""] ?? v ?? "—"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {RECIPE_YIELD_UNITS.map((u) => (
                <SelectItem key={u} value={u}>{YIELD_UNIT_LABELS[u]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-prep">Tiempo de preparación (min)</Label>
          <Input
            id="edit-prep"
            name="prep_time_min"
            type="number"
            min="1"
            defaultValue={defaultValues.prep_time_min ?? ""}
            placeholder="Ej: 60"
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="edit-desc">Descripción</Label>
          <Textarea
            id="edit-desc"
            name="description"
            defaultValue={defaultValues.description ?? ""}
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="edit-notes">Notas internas</Label>
          <Textarea
            id="edit-notes"
            name="notes"
            defaultValue={defaultValues.notes ?? ""}
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

export function RecetaDetail({ recipe, categories, rawMaterials, salePriceFactor }: Props) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [editErrors, setEditErrors] = useState<FormErrors | null>(null);
  const [isPending, startTransition] = useTransition();

  // Add ingredient form state
  const [selectedMpId, setSelectedMpId] = useState("");
  const [mpSearch, setMpSearch] = useState("");
  const [quantity, setQuantity] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const selectedMp = rawMaterials.find((m) => m.id === selectedMpId) ?? null;
  const recipeUnit = selectedMp ? toRecipeUnit(selectedMp.unit) : null;
  const unitLabel = recipeUnit ? (RECIPE_UNIT_LABELS[recipeUnit] ?? recipeUnit) : "";

  const filteredMaterials = rawMaterials.filter((m) =>
    m.name.toLowerCase().includes(mpSearch.toLowerCase())
  );

  // IDs already in the recipe — disable them in the selector
  const usedMpIds = new Set(recipe.ingredients.map((i) => i.raw_material_id));

  const handleEdit = useCallback((fd: FormData) => {
    startTransition(async () => {
      const result = await updateRecipe(recipe.id, null, fd);
      if ("error" in result) {
        setEditErrors(
          typeof result.error === "string" ? { _: [result.error] } : (result.error as FormErrors)
        );
        return;
      }
      setOpenEdit(false);
      setEditErrors(null);
      router.refresh();
    });
  }, [recipe.id]);

  const handleAddIngredient = useCallback(() => {
    if (!selectedMpId || !quantity || !recipeUnit) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setAddError("Ingresá una cantidad válida mayor a 0");
      return;
    }
    setAddError(null);
    startTransition(async () => {
      const result = await upsertIngredient(recipe.id, selectedMpId, qty, recipeUnit);
      if ("error" in result) {
        setAddError(typeof result.error === "string" ? result.error : "Error al agregar ingrediente");
        return;
      }
      setSelectedMpId("");
      setMpSearch("");
      setQuantity("");
      router.refresh();
    });
  }, [recipe.id, selectedMpId, quantity, recipeUnit]);

  const handleRemoveIngredient = useCallback((id: string) => {
    startTransition(async () => {
      await removeIngredient(id, recipe.id);
      router.refresh();
    });
  }, [recipe.id]);

  const cost = recipe.cost;
  const costPerUnit = cost?.cost_per_unit ?? null;
  const suggestedPrice = costPerUnit != null ? costPerUnit * salePriceFactor : null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href="/admin/recetas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Recetas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{recipe.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {recipe.category && (
                <Badge variant="outline" className="text-xs">{recipe.category.name}</Badge>
              )}
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Rinde {recipe.yield_quantity} {YIELD_UNIT_LABELS[recipe.yield_unit] ?? recipe.yield_unit}
              </span>
              {recipe.difficulty && (
                <span className="text-sm text-muted-foreground">
                  {DIFFICULTY_LABELS[recipe.difficulty]}
                </span>
              )}
              {recipe.prep_time_min && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {recipe.prep_time_min} min
                </span>
              )}
            </div>
            {recipe.description && (
              <p className="text-sm text-muted-foreground mt-1">{recipe.description}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setEditErrors(null); setOpenEdit(true); }}
          className="shrink-0"
        >
          <Pencil className="w-3.5 h-3.5 mr-1.5" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingredients — 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold">Ingredientes</h2>

          <div className="border border-border rounded-2xl overflow-hidden bg-surface">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/50 hover:bg-accent/50">
                  <TableHead className="font-medium">Materia prima</TableHead>
                  <TableHead className="font-medium text-right">Cantidad</TableHead>
                  <TableHead className="font-medium text-right">Costo</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipe.ingredients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">
                      Sin ingredientes. Agregá el primero.
                    </TableCell>
                  </TableRow>
                )}
                {recipe.ingredients.map((ing) => {
                  const ingCost = ing.quantity * (ing.raw_material?.price_per_gram ?? 0);
                  return (
                    <TableRow key={ing.id}>
                      <TableCell className="font-medium text-sm">
                        {ing.raw_material?.name ?? "Ingrediente eliminado"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {ing.quantity} {RECIPE_UNIT_LABELS[ing.unit] ?? ing.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatPrice(ingCost)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveIngredient(ing.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Add ingredient form */}
          <div className="border border-border rounded-2xl p-4 bg-surface space-y-3">
            <p className="text-sm font-medium">Agregar ingrediente</p>
            <div className="space-y-2">
              <Input
                placeholder="Buscar materia prima…"
                value={mpSearch}
                onChange={(e) => {
                  setMpSearch(e.target.value);
                  if (selectedMpId) setSelectedMpId("");
                }}
                className="text-sm"
              />
              {mpSearch && !selectedMpId && (
                <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-background shadow-sm">
                  {filteredMaterials.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3">Sin resultados</p>
                  ) : (
                    filteredMaterials.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        disabled={usedMpIds.has(m.id)}
                        onClick={() => {
                          setSelectedMpId(m.id);
                          setMpSearch(m.name);
                          setQuantity("");
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-accent transition-colors",
                          usedMpIds.has(m.id) && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        <span>{m.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {RECIPE_UNIT_LABELS[toRecipeUnit(m.unit)] ?? toRecipeUnit(m.unit)}
                          {usedMpIds.has(m.id) && " · ya agregado"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedMp && (
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">
                    Cantidad ({unitLabel})
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    min="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={`Ej: 500`}
                    className="text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleAddIngredient()}
                  />
                </div>
                <Button
                  onClick={handleAddIngredient}
                  disabled={isPending || !quantity}
                  className="gradient-brand text-white border-0 hover:opacity-90"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Agregar
                </Button>
              </div>
            )}
            {addError && <p className="text-xs text-destructive">{addError}</p>}
          </div>
        </div>

        {/* Cost summary — 1/3 */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Costos</h2>
          <div className="border border-border rounded-2xl p-5 bg-surface space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ingredientes</span>
              <span className="font-mono">{cost ? formatPrice(cost.ingredient_cost) : "—"}</span>
            </div>
            {cost && cost.overhead_cost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overhead</span>
                <span className="font-mono">{formatPrice(cost.overhead_cost)}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex justify-between text-sm font-medium">
              <span>Costo total</span>
              <span className="font-mono">{cost ? formatPrice(cost.total_cost) : "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Por {YIELD_UNIT_LABELS[recipe.yield_unit]?.slice(0, -1) ?? "unidad"}
              </span>
              <span className="font-mono font-medium">
                {costPerUnit != null ? formatPrice(costPerUnit) : "—"}
              </span>
            </div>

            {suggestedPrice != null && (
              <div className="mt-3 pt-3 border-t border-border rounded-xl bg-primary/5 p-3 -mx-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Precio sugerido (×{salePriceFactor})
                  </span>
                  <span className="font-mono font-bold text-primary text-lg">
                    {formatPrice(suggestedPrice)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {recipe.notes && (
            <div className="border border-border rounded-2xl p-4 bg-surface">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                Notas
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{recipe.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={openEdit} onOpenChange={(o) => { setOpenEdit(o); if (!o) setEditErrors(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar receta</DialogTitle>
          </DialogHeader>
          <RecetaForm
            categories={categories}
            defaultValues={recipe}
            onSubmit={handleEdit}
            loading={isPending}
            errors={editErrors}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
            <Button
              form="receta-edit-form"
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
    </div>
  );
}

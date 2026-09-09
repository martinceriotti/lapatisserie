"use client";

import { useState, useTransition, useActionState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  createRecipe,
  deleteRecipe,
  type RecipeWithCost,
  type RecipeCategory,
} from "@/lib/actions/recetas";
import {
  RECIPE_YIELD_UNITS,
  RECIPE_DIFFICULTIES,
  YIELD_UNIT_LABELS,
  DIFFICULTY_LABELS,
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
import { Plus, Pencil, Trash2, Search, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  initialData: RecipeWithCost[];
  categories: RecipeCategory[];
  salePriceFactor: number;
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(n);
}

// Forma singular corta para el resumen mobile ("Costo $X / u.")
const YIELD_UNIT_SHORT: Record<string, string> = {
  unidades: "u.",
  porciones: "porción",
  gramos: "g",
  kg: "kg",
};

type FormErrors = Record<string, string[]>;

function RecetaForm({
  categories,
  defaultValues,
  onSubmit,
  loading,
  errors,
}: {
  categories: RecipeCategory[];
  defaultValues?: Partial<RecipeWithCost>;
  onSubmit: (fd: FormData) => void;
  loading: boolean;
  errors: FormErrors | null;
}) {
  const [categoryId, setCategoryId] = useState(defaultValues?.category_id ?? "");
  const [yieldUnit, setYieldUnit] = useState(defaultValues?.yield_unit ?? "unidades");
  const [difficulty, setDifficulty] = useState(defaultValues?.difficulty ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("category_id", categoryId);
    fd.set("yield_unit", yieldUnit);
    fd.set("difficulty", difficulty);
    onSubmit(fd);
  }

  return (
    <form id="receta-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultValues?.name}
            placeholder="Ej: Alfajores de maicena"
            required
          />
          {errors?.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Sin categoría">
                {(v: string | null) => {
                  if (!v) return "Sin categoría";
                  return categories.find((c) => c.id === v)?.name ?? "Sin categoría";
                }}
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
          <Label htmlFor="yield_quantity">Rendimiento *</Label>
          <Input
            id="yield_quantity"
            name="yield_quantity"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={defaultValues?.yield_quantity ?? ""}
            placeholder="Ej: 20"
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
          <Label htmlFor="prep_time_min">Tiempo de preparación (min)</Label>
          <Input
            id="prep_time_min"
            name="prep_time_min"
            type="number"
            min="1"
            defaultValue={defaultValues?.prep_time_min ?? ""}
            placeholder="Ej: 60"
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={defaultValues?.description ?? ""}
            placeholder="Descripción breve de la receta…"
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="notes">Notas internas</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={defaultValues?.notes ?? ""}
            placeholder="Técnicas, consejos, observaciones…"
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

export function RecetasList({ initialData, categories, salePriceFactor }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [openCreate, setOpenCreate] = useState(false);
  const [deleting, setDeleting] = useState<RecipeWithCost | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = initialData.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || r.category_id === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleCreate = useCallback((fd: FormData) => {
    startTransition(async () => {
      const result = await createRecipe(null, fd);
      if ("error" in result) {
        setFormErrors(
          typeof result.error === "string" ? { _: [result.error] } : (result.error as FormErrors)
        );
        return;
      }
      setOpenCreate(false);
      setFormErrors(null);
      if ("id" in result && result.id) {
        router.push(`/admin/recetas/${result.id}`);
      }
    });
  }, [router]);

  const handleDelete = useCallback(() => {
    if (!deleting) return;
    startTransition(async () => {
      await deleteRecipe(deleting.id);
      setDeleting(null);
      router.refresh();
    });
  }, [deleting]);

  return (
    <>
      {/* Toolbar */}
      <div className="grid grid-cols-[1fr_auto] gap-3 mb-5 sm:flex sm:flex-row">
        <div className="relative col-span-2 sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar receta…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
          <SelectTrigger className="min-w-0 sm:w-44">
            <SelectValue>
              {(v: string | null) =>
                !v || v === "all"
                  ? "Todas las categorías"
                  : (categories.find((c) => c.id === v)?.name ?? "Todas")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => { setFormErrors(null); setOpenCreate(true); }}
          className="gradient-brand text-white border-0 hover:opacity-90 shrink-0"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Nueva receta</span>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-border rounded-2xl p-12 text-center text-muted-foreground text-sm bg-surface">
          {search || categoryFilter !== "all"
            ? "No se encontraron recetas."
            : "Todavía no hay recetas. Creá la primera."}
        </div>
      ) : (
        <>
          {/* Lista — mobile */}
          <div className="md:hidden border border-border rounded-2xl overflow-hidden divide-y divide-border bg-surface">
            {filtered.map((r) => {
              const costPerUnit = r.cost?.cost_per_unit ?? null;
              const suggestedPrice = costPerUnit != null ? costPerUnit * salePriceFactor : null;
              return (
                <div
                  key={r.id}
                  className={cn(
                    "px-4 py-3 cursor-pointer active:bg-muted/30",
                    !r.is_active && "opacity-50"
                  )}
                  onClick={() => router.push(`/admin/recetas/${r.id}`)}
                >
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-sm flex-1 min-w-0">{r.name}</span>
                    {r.category && (
                      <Badge variant="outline" className="text-xs shrink-0">{r.category.name}</Badge>
                    )}
                    <button
                      className="shrink-0 -mr-1 -mt-0.5 p-1 text-muted-foreground/60 hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setDeleting(r); }}
                      title="Eliminar receta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      {costPerUnit != null
                        ? `Costo ${formatPrice(costPerUnit)} / ${YIELD_UNIT_SHORT[r.yield_unit] ?? r.yield_unit}`
                        : "Sin costo"}
                    </span>
                    {suggestedPrice != null && (
                      <span className="text-sm font-mono font-semibold text-primary shrink-0">
                        Sug. {formatPrice(suggestedPrice)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabla — desktop */}
          <div className="hidden md:block border border-border rounded-2xl overflow-hidden bg-surface">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/50 hover:bg-accent/50">
                  <TableHead className="font-medium">Nombre</TableHead>
                  <TableHead className="font-medium">Categoría</TableHead>
                  <TableHead className="font-medium">Rendimiento</TableHead>
                  <TableHead className="font-medium text-right">Costo total</TableHead>
                  <TableHead className="font-medium text-right">Costo/unidad</TableHead>
                  <TableHead className="font-medium text-right">Precio sugerido</TableHead>
                  <TableHead className="font-medium text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const costPerUnit = r.cost?.cost_per_unit ?? null;
                  const suggestedPrice = costPerUnit != null ? costPerUnit * salePriceFactor : null;
                  return (
                    <TableRow
                      key={r.id}
                      className={cn("cursor-pointer", !r.is_active && "opacity-50")}
                      onClick={() => router.push(`/admin/recetas/${r.id}`)}
                    >
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>
                        {r.category ? (
                          <Badge variant="outline" className="text-xs">{r.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground/40 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.yield_quantity} {YIELD_UNIT_LABELS[r.yield_unit] ?? r.yield_unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {r.cost ? formatPrice(r.cost.total_cost) : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {costPerUnit != null ? formatPrice(costPerUnit) : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-primary">
                        {suggestedPrice != null ? formatPrice(suggestedPrice) : <span className="text-muted-foreground/40 font-normal">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => router.push(`/admin/recetas/${r.id}`)}
                            title="Ver receta"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleting(r)}
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
        </>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        {filtered.length} de {initialData.length} recetas · Factor de precio: ×{salePriceFactor}
      </p>

      {/* Create dialog */}
      <Dialog open={openCreate} onOpenChange={(o) => { setOpenCreate(o); if (!o) setFormErrors(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva receta</DialogTitle>
          </DialogHeader>
          <RecetaForm
            categories={categories}
            onSubmit={handleCreate}
            loading={isPending}
            errors={formErrors}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
            <Button
              form="receta-form"
              type="submit"
              disabled={isPending}
              className="gradient-brand text-white border-0"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear y agregar ingredientes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar receta?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deleting?.name}</strong> y todos sus ingredientes.
              Esta acción no se puede deshacer.
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

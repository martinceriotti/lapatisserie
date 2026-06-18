"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { UNITS, CATEGORIES, MATERIAL_TYPES } from "@/lib/constants/materias-primas";

export type RecipeOption = {
  id: string;
  name: string;
  yield_quantity: number;
  yield_unit: string;
};

const schema = z.object({
  name: z.string().min(1, "Nombre requerido").max(200),
  description: z.string().max(500).optional(),
  unit: z.enum(UNITS),
  category: z.enum(CATEGORIES),
  material_type: z.enum(MATERIAL_TYPES).default("materia_prima"),
  recipe_id: z.string().uuid().optional().or(z.literal("")),
  current_price: z.coerce.number().nonnegative("El precio debe ser 0 o mayor"),
  sale_price: z.coerce.number().nonnegative().optional().or(z.literal("")),
  is_active: z.coerce.boolean().default(true),
});

export type MateriaPrimaFormData = z.infer<typeof schema>;

export type ActionResult =
  | { success: true }
  | { error: Record<string, string[]> | string };

export async function createMateriaPrima(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase.from("raw_materials").insert([{
    ...parsed.data,
    recipe_id: parsed.data.recipe_id || null,
    sale_price: parsed.data.sale_price || null,
  }]);
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/materias-primas");
  return { success: true };
}

export async function updateMateriaPrima(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("raw_materials")
    .update({ ...parsed.data, recipe_id: parsed.data.recipe_id || null, sale_price: parsed.data.sale_price || null })
    .eq("id", id);
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/materias-primas");
  return { success: true };
}

export async function deleteMateriaPrima(id: string): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { data: usages } = await supabase
    .from("recipe_ingredients")
    .select("recipe:recipes(name)")
    .eq("raw_material_id", id);

  if (usages && usages.length > 0) {
    const names = usages
      .map((u: any) => u.recipe?.name)
      .filter(Boolean)
      .join(", ");
    return {
      error: `No se puede eliminar: está en uso en ${usages.length} ${usages.length === 1 ? "receta" : "recetas"}${names ? ": " + names : ""}.`,
    };
  }

  const { error } = await supabase.from("raw_materials").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/materias-primas");
  return { success: true };
}

export async function getRecipesForMaterials(): Promise<RecipeOption[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, name, yield_quantity, yield_unit")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function syncIntermediatePrice(id: string): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { data: rm } = await supabase
    .from("raw_materials")
    .select("recipe_id")
    .eq("id", id)
    .single();

  if (!rm?.recipe_id) return { error: "No tiene receta vinculada." };

  const { data: cost } = await supabase
    .from("recipe_costs")
    .select("cost_per_unit")
    .eq("recipe_id", rm.recipe_id)
    .single();

  if (!cost?.cost_per_unit) {
    return { error: "La receta no tiene costo calculado. Revisá que tenga ingredientes con precio." };
  }

  const { error } = await supabase
    .from("raw_materials")
    .update({ current_price: cost.cost_per_unit })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/materias-primas");
  revalidatePath("/admin/recetas");
  return { success: true };
}

export async function getMateriasWithHistory() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("raw_materials")
    .select(`
      *,
      price_history:raw_material_price_history(
        id, price, effective_date, notes,
        supplier:suppliers(id, name)
      ),
      supplier_offers:supplier_catalog(
        id, supplier_sku, product_name, price_final, price_net, conversion_factor, unit_description, list_date,
        supplier:suppliers(id, name)
      )
    `)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

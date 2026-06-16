"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { RECIPE_YIELD_UNITS, RECIPE_DIFFICULTIES } from "@/lib/constants/recetas";

export type ActionResult =
  | { success: true }
  | { error: Record<string, string[]> | string };

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecipeCategory = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
};

export type RecipeCost = {
  recipe_id: string;
  recipe_name: string;
  yield_quantity: number;
  yield_unit: string;
  ingredient_cost: number;
  overhead_cost: number;
  total_cost: number;
  cost_per_unit: number;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  raw_material_id: string;
  quantity: number;
  unit: string;
  notes: string | null;
  raw_material: {
    id: string;
    name: string;
    unit: string;
    current_price: number;
    price_per_gram: number | null;
  } | null;
};

export type Recipe = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category_id: string | null;
  yield_quantity: number;
  yield_unit: string;
  prep_time_min: number | null;
  difficulty: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category: RecipeCategory | null;
};

export type RecipeWithCost = Recipe & { cost: RecipeCost | null };

export type RecipeDetail = Recipe & {
  ingredients: RecipeIngredient[];
  cost: RecipeCost | null;
};

// ── Schemas ───────────────────────────────────────────────────────────────────

const recipeSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(200),
  description: z.string().max(500).optional(),
  category_id: z.string().uuid().optional().or(z.literal("")),
  yield_quantity: z.coerce.number().positive("Rendimiento debe ser mayor a 0"),
  yield_unit: z.enum(RECIPE_YIELD_UNITS),
  difficulty: z.enum(RECIPE_DIFFICULTIES).optional().or(z.literal("")),
  prep_time_min: z.coerce.number().int().positive().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
});

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getRecipeCategories(): Promise<RecipeCategory[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("recipe_categories")
    .select("*")
    .order("display_order");
  if (error) throw error;
  return data ?? [];
}

export async function getRecipes(): Promise<RecipeWithCost[]> {
  const supabase = createAdminClient();
  const [recipesRes, costsRes] = await Promise.all([
    supabase
      .from("recipes")
      .select("*, category:recipe_categories(id, name, slug, display_order)")
      .order("name"),
    supabase.from("recipe_costs").select("*"),
  ]);
  if (recipesRes.error) throw recipesRes.error;
  if (costsRes.error) throw costsRes.error;

  const costsMap = new Map<string, RecipeCost>(
    (costsRes.data ?? []).map((c) => [c.recipe_id, c as RecipeCost])
  );
  return (recipesRes.data ?? []).map((r) => ({
    ...(r as Recipe),
    cost: costsMap.get(r.id) ?? null,
  }));
}

export async function getRecipe(id: string): Promise<RecipeDetail> {
  const supabase = createAdminClient();
  const [recipeRes, costsRes] = await Promise.all([
    supabase
      .from("recipes")
      .select(`
        *,
        category:recipe_categories(id, name, slug, display_order),
        ingredients:recipe_ingredients(
          id, recipe_id, raw_material_id, quantity, unit, notes,
          raw_material:raw_materials(id, name, unit, current_price, price_per_gram)
        )
      `)
      .eq("id", id)
      .single(),
    supabase.from("recipe_costs").select("*").eq("recipe_id", id).maybeSingle(),
  ]);
  if (recipeRes.error) throw recipeRes.error;
  return {
    ...(recipeRes.data as unknown as Recipe & { ingredients: RecipeIngredient[] }),
    cost: (costsRes.data as RecipeCost | null) ?? null,
  };
}

export async function getRawMaterialsForRecipe() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("raw_materials")
    .select("id, name, unit, current_price, price_per_gram")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

// ── Mutations ─────────────────────────────────────────────────────────────────

function makeSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export async function createRecipe(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult & { id?: string }> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = recipeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("recipes")
    .insert([{
      name: parsed.data.name,
      slug: makeSlug(parsed.data.name),
      description: parsed.data.description || null,
      category_id: parsed.data.category_id || null,
      yield_quantity: parsed.data.yield_quantity,
      yield_unit: parsed.data.yield_unit,
      difficulty: parsed.data.difficulty || null,
      prep_time_min: parsed.data.prep_time_min || null,
      notes: parsed.data.notes || null,
    }])
    .select("id")
    .single();
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/recetas");
  return { success: true, id: data.id };
}

export async function updateRecipe(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = recipeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("recipes")
    .update({
      name: parsed.data.name,
      slug: makeSlug(parsed.data.name),
      description: parsed.data.description || null,
      category_id: parsed.data.category_id || null,
      yield_quantity: parsed.data.yield_quantity,
      yield_unit: parsed.data.yield_unit,
      difficulty: parsed.data.difficulty || null,
      prep_time_min: parsed.data.prep_time_min || null,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/recetas");
  revalidatePath(`/admin/recetas/${id}`);
  return { success: true };
}

export async function deleteRecipe(id: string): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/recetas");
  return { success: true };
}

export async function upsertIngredient(
  recipeId: string,
  rawMaterialId: string,
  quantity: number,
  unit: string,
  notes?: string
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("recipe_ingredients").upsert(
    {
      recipe_id: recipeId,
      raw_material_id: rawMaterialId,
      quantity,
      unit,
      notes: notes || null,
    },
    { onConflict: "recipe_id,raw_material_id" }
  );
  if (error) return { error: error.message };

  revalidatePath(`/admin/recetas/${recipeId}`);
  return { success: true };
}

export async function removeIngredient(
  id: string,
  recipeId: string
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("recipe_ingredients").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/recetas/${recipeId}`);
  return { success: true };
}

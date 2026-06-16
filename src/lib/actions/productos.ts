"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import type { RecipeCost } from "@/lib/actions/recetas";

export type ActionResult =
  | { success: true }
  | { error: Record<string, string[]> | string };

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
};

export type RecipeOption = {
  id: string;
  name: string;
  yield_quantity: number;
  yield_unit: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  type: "receta_completa" | "porcion";
  portion_qty: number;
  category_id: string | null;
  recipe_id: string | null;
  base_price: number | null;
  price_display: "from" | "consult" | "fixed";
  min_order_qty: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  category: ProductCategory | null;
  recipe: RecipeOption | null;
};

export type ProductWithCost = Product & { cost: RecipeCost | null };

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getProductCategories(): Promise<ProductCategory[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .order("display_order");
  if (error) throw error;
  return data ?? [];
}

export async function getRecipesForSelect(): Promise<RecipeOption[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, name, yield_quantity, yield_unit")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getProducts(): Promise<ProductWithCost[]> {
  const supabase = createAdminClient();
  const [productsRes, costsRes] = await Promise.all([
    supabase
      .from("products")
      .select(`
        id, name, slug, short_description, type, portion_qty,
        category_id, recipe_id, base_price, price_display,
        min_order_qty, is_featured, is_active, created_at,
        category:product_categories(id, name, slug, description, display_order),
        recipe:recipes(id, name, yield_quantity, yield_unit)
      `)
      .order("name"),
    supabase.from("recipe_costs").select("*"),
  ]);
  if (productsRes.error) throw productsRes.error;
  if (costsRes.error) throw costsRes.error;

  const costsMap = new Map<string, RecipeCost>(
    (costsRes.data ?? []).map((c) => [c.recipe_id, c as RecipeCost])
  );

  return (productsRes.data ?? []).map((p) => ({
    ...(p as unknown as Product),
    cost: p.recipe_id ? (costsMap.get(p.recipe_id) ?? null) : null,
  }));
}

// ── Schema ─────────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(200),
  type: z.enum(["receta_completa", "porcion"]),
  portion_qty: z.coerce.number().positive().default(1),
  short_description: z.string().max(300).optional(),
  category_id: z.string().uuid().optional().or(z.literal("")),
  recipe_id: z.string().uuid().optional().or(z.literal("")),
  price_display: z.enum(["fixed", "from", "consult"]).default("consult"),
  base_price: z.coerce.number().positive().optional().or(z.literal("")),
  min_order_qty: z.coerce.number().int().positive().default(1),
  is_featured: z.preprocess((v) => v === "true" || v === true, z.boolean()).default(false),
});

function makeSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function createProduct(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase.from("products").insert([{
    name: parsed.data.name,
    slug: makeSlug(parsed.data.name),
    type: parsed.data.type,
    portion_qty: parsed.data.portion_qty,
    short_description: parsed.data.short_description || null,
    category_id: parsed.data.category_id || null,
    recipe_id: parsed.data.recipe_id || null,
    price_display: parsed.data.price_display,
    base_price: parsed.data.base_price || null,
    min_order_qty: parsed.data.min_order_qty,
    is_featured: parsed.data.is_featured,
    is_active: true,
  }]);
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  return { success: true };
}

export async function updateProduct(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      slug: makeSlug(parsed.data.name),
      type: parsed.data.type,
      portion_qty: parsed.data.portion_qty,
      short_description: parsed.data.short_description || null,
      category_id: parsed.data.category_id || null,
      recipe_id: parsed.data.recipe_id || null,
      price_display: parsed.data.price_display,
      base_price: parsed.data.base_price || null,
      min_order_qty: parsed.data.min_order_qty,
      is_featured: parsed.data.is_featured,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  return { success: true };
}

export async function toggleProduct(
  id: string,
  field: "is_active" | "is_featured",
  value: boolean
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  return { success: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  return { success: true };
}

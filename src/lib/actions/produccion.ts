"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ProductionProduct = {
  product_id: string;
  product_name: string;
  recipe_id: string | null;
  recipe_name: string | null;
  total_quantity: number;
  unit: string;
  orders: { order_number: string; customer: string; quantity: number; delivery_date: string | null }[];
};

export type ProductionIngredient = {
  raw_material_id: string;
  raw_material_name: string;
  unit: string;
  total_quantity: number;
  stock_quantity: number;
};

export type ProductionPlan = {
  orders_count: number;
  products: ProductionProduct[];
  ingredients: ProductionIngredient[];
};

const ACTIVE_STATUSES = ["presupuestado", "confirmado", "en_produccion", "listo"];

export async function getProductionPlan(from: string, to: string): Promise<ProductionPlan> {
  const supabase = createAdminClient();

  // 1. Orders with items — fetch both raw_material and direct recipe_id
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select(`
      id, order_number, delivery_date,
      customer:customers(name),
      items:order_items(
        quantity, description,
        recipe_id,
        raw_material:raw_materials(id, name, recipe_id)
      )
    `)
    .gte("delivery_date", from)
    .lte("delivery_date", to)
    .in("status", ACTIVE_STATUSES)
    .order("delivery_date");

  if (ordersError) throw ordersError;
  const orders = ordersData ?? [];

  // 2. Collect all recipe IDs from both paths
  const recipeIds = [
    ...new Set(
      orders
        .flatMap((o) =>
          (o.items as any[]).flatMap((i) => [
            i.recipe_id as string | null,           // direct recipe on item
            i.raw_material?.recipe_id as string | null,  // via linked raw_material
          ])
        )
        .filter(Boolean) as string[]
    ),
  ];

  // 3. Fetch recipes with ingredients
  const recipesMap = new Map<string, { yield_quantity: number; yield_unit: string; name: string; ingredients: any[] }>();
  if (recipeIds.length > 0) {
    const { data: recipesData } = await supabase
      .from("recipes")
      .select(`
        id, name, yield_quantity, yield_unit,
        ingredients:recipe_ingredients(
          quantity, unit,
          raw_material:raw_materials(id, name, unit)
        )
      `)
      .in("id", recipeIds);

    for (const r of recipesData ?? []) {
      recipesMap.set(r.id, {
        name: r.name,
        yield_quantity: r.yield_quantity,
        yield_unit: r.yield_unit,
        ingredients: r.ingredients as any[],
      });
    }
  }

  // 4. Aggregate products — handles both paths
  const productMap = new Map<string, ProductionProduct>();
  for (const order of orders) {
    const customerName = (order.customer as any)?.name ?? "—";
    for (const item of (order.items as any[])) {
      const rm = item.raw_material;
      const directRecipeId = item.recipe_id as string | null;

      let key: string;
      let productName: string;
      let resolvedRecipeId: string | null;

      if (rm) {
        // Item linked to a raw_material (producto_terminado with optional recipe)
        key = `product:${rm.id}`;
        productName = rm.name;
        resolvedRecipeId = rm.recipe_id ?? null;
      } else if (directRecipeId) {
        // Item linked directly to a recipe
        key = `recipe:${directRecipeId}`;
        productName = recipesMap.get(directRecipeId)?.name ?? item.description ?? "—";
        resolvedRecipeId = directRecipeId;
      } else {
        continue; // free-text item with no product/recipe, skip
      }

      if (!productMap.has(key)) {
        productMap.set(key, {
          product_id: rm?.id ?? directRecipeId ?? key,
          product_name: productName,
          recipe_id: resolvedRecipeId,
          recipe_name: resolvedRecipeId ? (recipesMap.get(resolvedRecipeId)?.name ?? null) : null,
          total_quantity: 0,
          unit: "unidad(es)",
          orders: [],
        });
      }
      const entry = productMap.get(key)!;
      const itemQty = Number(item.quantity);
      entry.total_quantity += itemQty;
      entry.orders.push({
        order_number: order.order_number,
        customer: customerName,
        quantity: itemQty,
        delivery_date: order.delivery_date,
      });
    }
  }

  // 5. Aggregate ingredients across all products that have a recipe
  const ingredientMap = new Map<string, ProductionIngredient>();
  for (const [, prod] of productMap) {
    if (!prod.recipe_id) continue;
    const recipe = recipesMap.get(prod.recipe_id);
    if (!recipe) continue;

    const yieldQty = Number(recipe.yield_quantity);
    const scaleFactor = prod.total_quantity / yieldQty;

    for (const ing of recipe.ingredients) {
      const ingRm = ing.raw_material;
      if (!ingRm) continue;
      const needed = Number(ing.quantity) * scaleFactor;
      if (ingredientMap.has(ingRm.id)) {
        ingredientMap.get(ingRm.id)!.total_quantity += needed;
      } else {
        ingredientMap.set(ingRm.id, {
          raw_material_id: ingRm.id,
          raw_material_name: ingRm.name,
          unit: ing.unit ?? ingRm.unit,
          total_quantity: needed,
          stock_quantity: 0,
        });
      }
    }
  }

  // 6. Fetch current stock for each ingredient
  const ingredientIds = Array.from(ingredientMap.keys());
  if (ingredientIds.length > 0) {
    const { data: stockData } = await supabase
      .from("raw_materials")
      .select("id, stock_quantity")
      .in("id", ingredientIds);
    for (const row of stockData ?? []) {
      const ing = ingredientMap.get(row.id);
      if (ing) ing.stock_quantity = Number(row.stock_quantity ?? 0);
    }
  }

  return {
    orders_count: orders.length,
    products: Array.from(productMap.values()).sort((a, b) => a.product_name.localeCompare(b.product_name)),
    ingredients: Array.from(ingredientMap.values()).sort((a, b) => a.raw_material_name.localeCompare(b.raw_material_name)),
  };
}

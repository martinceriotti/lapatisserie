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

  // 1. Orders with items in the date range
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select(`
      id, order_number, delivery_date,
      customer:customers(name),
      items:order_items(
        quantity,
        product:products(id, name, type, portion_qty, recipe_id)
      )
    `)
    .gte("delivery_date", from)
    .lte("delivery_date", to)
    .in("status", ACTIVE_STATUSES)
    .order("delivery_date");

  if (ordersError) throw ordersError;
  const orders = ordersData ?? [];

  // 2. Collect unique recipe IDs
  const recipeIds = [
    ...new Set(
      orders
        .flatMap((o) => (o.items as any[]).map((i) => i.product?.recipe_id))
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

  // 4. Aggregate products
  const productMap = new Map<string, ProductionProduct>();
  for (const order of orders) {
    const customerName = (order.customer as any)?.name ?? "—";
    for (const item of (order.items as any[])) {
      const p = item.product;
      if (!p) continue;
      const key = p.id;
      if (!productMap.has(key)) {
        productMap.set(key, {
          product_id: p.id,
          product_name: p.name,
          recipe_id: p.recipe_id ?? null,
          recipe_name: p.recipe_id ? (recipesMap.get(p.recipe_id)?.name ?? null) : null,
          total_quantity: 0,
          unit: p.type === "receta_completa" ? "receta(s)" : "unidad(es)",
          orders: [],
        });
      }
      const entry = productMap.get(key)!;
      const itemQty = Number(item.quantity);
      const portionQty = p.type === "porcion" ? Number(p.portion_qty ?? 1) : 1;
      const effectiveQty = itemQty * portionQty;
      entry.total_quantity += effectiveQty;
      entry.orders.push({
        order_number: order.order_number,
        customer: customerName,
        quantity: itemQty,
        delivery_date: order.delivery_date,
      });
    }
  }

  // 5. Aggregate ingredients
  const ingredientMap = new Map<string, ProductionIngredient>();
  for (const [, prod] of productMap) {
    if (!prod.recipe_id) continue;
    const recipe = recipesMap.get(prod.recipe_id);
    if (!recipe) continue;

    const yieldQty = Number(recipe.yield_quantity);
    const scaleFactor = prod.total_quantity / yieldQty;

    for (const ing of recipe.ingredients) {
      const rm = ing.raw_material;
      if (!rm) continue;
      const needed = Number(ing.quantity) * scaleFactor;
      if (ingredientMap.has(rm.id)) {
        ingredientMap.get(rm.id)!.total_quantity += needed;
      } else {
        ingredientMap.set(rm.id, {
          raw_material_id: rm.id,
          raw_material_name: rm.name,
          unit: ing.unit ?? rm.unit,
          total_quantity: needed,
          stock_quantity: 0,
        });
      }
    }
  }

  // 6. Fetch stock levels for the relevant raw materials
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

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const checks = await Promise.all([
      supabase.from("raw_materials").select("count", { count: "exact", head: true }),
      supabase.from("recipes").select("count", { count: "exact", head: true }),
      supabase.from("products").select("count", { count: "exact", head: true }),
      supabase.from("overhead_settings").select("name, type, value"),
      supabase.from("recipe_categories").select("name").order("display_order"),
      supabase.from("product_categories").select("name").order("display_order"),
    ]);

    const [materials, recipes, products, overhead, recipeCategories, productCategories] = checks;

    const errors = checks.filter((c) => c.error).map((c) => c.error?.message);

    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      database: {
        raw_materials: materials.count ?? 0,
        recipes: recipes.count ?? 0,
        products: products.count ?? 0,
      },
      overhead_settings: overhead.data,
      recipe_categories: recipeCategories.data?.map((c) => c.name),
      product_categories: productCategories.data?.map((c) => c.name),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

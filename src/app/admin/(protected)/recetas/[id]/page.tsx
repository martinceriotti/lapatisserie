import { notFound } from "next/navigation";
import { getRecipe, getRecipeCategories, getRawMaterialsForRecipe } from "@/lib/actions/recetas";
import { getSettings } from "@/lib/actions/settings";
import { RecetaDetail } from "@/components/admin/recetas/RecetaDetail";

export default async function RecetaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [recipe, categories, rawMaterials, settings] = await Promise.all([
    getRecipe(id).catch(() => null),
    getRecipeCategories(),
    getRawMaterialsForRecipe(),
    getSettings().catch(() => ({ sale_price_factor: 3 })),
  ]);

  if (!recipe) notFound();

  return (
    <RecetaDetail
      recipe={recipe}
      categories={categories}
      rawMaterials={rawMaterials}
      salePriceFactor={settings.sale_price_factor}
    />
  );
}

import { getRecipes, getRecipeCategories } from "@/lib/actions/recetas";
import { getSettings } from "@/lib/actions/settings";
import { RecetasList } from "@/components/admin/recetas/RecetasList";

export const metadata = { title: "Recetas | Admin" };

export default async function RecetasPage() {
  const [recipes, categories, settings] = await Promise.all([
    getRecipes(),
    getRecipeCategories(),
    getSettings().catch(() => ({ sale_price_factor: 3 })),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-foreground">Recetas</h1>
        <p className="text-muted-foreground mt-1">
          Costos calculados automáticamente según precios actuales de materias primas.
        </p>
      </div>
      <RecetasList
        initialData={recipes}
        categories={categories}
        salePriceFactor={settings.sale_price_factor}
      />
    </div>
  );
}

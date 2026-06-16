import { getProducts, getProductCategories, getRecipesForSelect } from "@/lib/actions/productos";
import { getSettings } from "@/lib/actions/settings";
import { ProductosList } from "@/components/admin/productos/ProductosList";

export const metadata = { title: "Productos | Admin" };

export default async function ProductosPage() {
  const [products, categories, recipes, settings] = await Promise.all([
    getProducts(),
    getProductCategories(),
    getRecipesForSelect(),
    getSettings().catch(() => ({ sale_price_factor: 3 })),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-foreground">Productos</h1>
        <p className="text-muted-foreground mt-1">
          Catálogo de productos disponibles para la venta.
        </p>
      </div>
      <ProductosList
        initialData={products}
        categories={categories}
        recipes={recipes}
        salePriceFactor={settings.sale_price_factor}
      />
    </div>
  );
}

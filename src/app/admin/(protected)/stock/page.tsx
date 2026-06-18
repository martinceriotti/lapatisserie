import { getStockLevels } from "@/lib/actions/stock";
import { StockView } from "@/components/admin/stock/StockView";

export const metadata = { title: "Stock | Admin" };

export default async function StockPage() {
  const items = await getStockLevels();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-foreground">Stock</h1>
        <p className="text-muted-foreground mt-1">
          Inventario actual de materias primas. Registrá compras o ajustá el stock manualmente.
        </p>
      </div>
      <StockView items={items} />
    </div>
  );
}

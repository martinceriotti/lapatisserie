import { getOrder, getProductsForOrder, getCustomers } from "@/lib/actions/pedidos";
import { getSettings } from "@/lib/actions/settings";
import { PedidoDetail } from "@/components/admin/pedidos/PedidoDetail";
import { notFound } from "next/navigation";

export const metadata = { title: "Detalle pedido | Admin" };

export default async function PedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const settings = await getSettings().catch(() => ({ sale_price_factor: 3, deposit_pct: 50 }));

  const [order, products, customers] = await Promise.all([
    getOrder(id).catch(() => null),
    getProductsForOrder(),
    getCustomers(),
  ]);

  if (!order) notFound();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PedidoDetail
        order={order}
        products={products}
        customers={customers}
        depositPct={settings.deposit_pct}
      />
    </div>
  );
}

import { getOrder, getProductsForOrder } from "@/lib/actions/pedidos";
import { getCustomers } from "@/lib/actions/pedidos";
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

  const [order, products, customers, settings] = await Promise.all([
    getOrder(id).catch(() => null),
    getProductsForOrder(),
    getCustomers(),
    getSettings().catch(() => ({ sale_price_factor: 3, deposit_pct: 50 })),
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

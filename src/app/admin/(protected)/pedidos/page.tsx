import { getOrders } from "@/lib/actions/pedidos";
import { PedidosList } from "@/components/admin/pedidos/PedidosList";

export const metadata = { title: "Pedidos | Admin" };

export default async function PedidosPage() {
  const orders = await getOrders();

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-foreground">Pedidos</h1>
        <p className="text-muted-foreground mt-1">
          Gestión de pedidos y presupuestos.
        </p>
      </div>
      <PedidosList initialData={orders} />
    </div>
  );
}

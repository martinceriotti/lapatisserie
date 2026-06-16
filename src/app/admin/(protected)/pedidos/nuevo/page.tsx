import { getCustomers } from "@/lib/actions/pedidos";
import { PedidoNuevo } from "@/components/admin/pedidos/PedidoNuevo";

export const metadata = { title: "Nuevo pedido | Admin" };

export default async function NuevoPedidoPage() {
  const customers = await getCustomers();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-foreground">Nuevo pedido</h1>
        <p className="text-muted-foreground mt-1">
          Completá los datos básicos. Después podés agregar los productos.
        </p>
      </div>
      <PedidoNuevo customers={customers} />
    </div>
  );
}

import { Users } from "lucide-react";
import { getClientes } from "@/lib/actions/clientes";
import { ClientesTable } from "@/components/admin/clientes/ClientesTable";

export const metadata = { title: "Clientes | Admin" };

export default async function ClientesPage() {
  const clientes = await getClientes();

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Clientes</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Tus clientes y su historial de pedidos. Se crean solos al cargar un pedido; acá los editás y consultás.
        </p>
      </div>

      <ClientesTable initialData={clientes} />
    </div>
  );
}

import { getSuppliers } from "@/lib/actions/suppliers";
import { SuppliersTable } from "@/components/admin/proveedores/SuppliersTable";
import { Truck } from "lucide-react";

export default async function ProveedoresPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Truck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Proveedores</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Administrá tus proveedores y sus catálogos de precios.
          Vinculá cada producto del catálogo con tus materias primas para actualizar precios con un click.
        </p>
      </div>

      <SuppliersTable initialData={suppliers} />
    </div>
  );
}

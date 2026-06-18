import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupplier, getSupplierCatalog, getRawMaterialsList } from "@/lib/actions/suppliers";
import { SupplierCatalogTable } from "@/components/admin/proveedores/SupplierCatalogTable";
import { ChevronLeft, Truck, Phone, Mail, MapPin } from "lucide-react";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [supplier, catalog, rawMaterials] = await Promise.all([
    getSupplier(id).catch(() => null),
    getSupplierCatalog(id),
    getRawMaterialsList(),
  ]);

  if (!supplier) notFound();

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/admin/proveedores"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Proveedores
        </Link>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{supplier.name}</h1>
            <div className="flex flex-wrap gap-4 mt-1">
              {supplier.phone && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  {supplier.phone}
                </span>
              )}
              {supplier.email && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  {supplier.email}
                </span>
              )}
              {supplier.address && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {supplier.address}
                </span>
              )}
            </div>
            {supplier.notes && (
              <p className="text-sm text-muted-foreground mt-1">{supplier.notes}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Catálogo de productos</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Cada producto puede vincularse a una materia prima. Una vez vinculado, podés aplicar
          el precio de este proveedor a esa materia prima con un solo click.
        </p>
      </div>

      <SupplierCatalogTable
        supplierId={supplier.id}
        supplierName={supplier.name}
        parserType={supplier.parser_type ?? null}
        ivaRate={supplier.default_iva_rate ?? 0.21}
        initialData={catalog}
        rawMaterials={rawMaterials}
      />
    </div>
  );
}

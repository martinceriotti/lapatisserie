import { getSettings, getOverheadSettings } from "@/lib/actions/settings";
import { SettingsForm } from "@/components/admin/configuracion/SettingsForm";
import { OverheadTable } from "@/components/admin/configuracion/OverheadTable";
import { Settings, Layers } from "lucide-react";

export const metadata = { title: "Configuración | Admin" };

export default async function ConfiguracionPage() {
  const [settings, overhead] = await Promise.all([
    getSettings(),
    getOverheadSettings(),
  ]);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Parámetros que afectan los costos y precios de todas las recetas.
        </p>
      </div>

      <div className="border border-border rounded-2xl bg-surface divide-y divide-border">
        {/* Sale price factor */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Precio de venta
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Multiplicador que se aplica sobre el costo por unidad para calcular el precio sugerido de venta.
          </p>
          <SettingsForm currentFactor={settings.sale_price_factor} />
        </div>

        {/* Overhead */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Overhead
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Costos adicionales que se suman al costo de ingredientes en cada receta.
            Los porcentajes se calculan sobre el costo total de ingredientes.
          </p>
          <OverheadTable initialData={overhead} />
        </div>
      </div>
    </div>
  );
}

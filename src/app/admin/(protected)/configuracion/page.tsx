import { getSettings } from "@/lib/actions/settings";
import { SettingsForm } from "@/components/admin/configuracion/SettingsForm";
import { Settings } from "lucide-react";

export const metadata = { title: "Configuración | Admin" };

export default async function ConfiguracionPage() {
  const settings = await getSettings();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Parámetros generales del sistema.
        </p>
      </div>

      <div className="border border-border rounded-2xl bg-surface divide-y divide-border">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Precios de venta
            </h2>
          </div>
          <SettingsForm currentFactor={settings.sale_price_factor} />
        </div>
      </div>
    </div>
  );
}

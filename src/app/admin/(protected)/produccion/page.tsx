import { getProductionPlan } from "@/lib/actions/produccion";
import { ProduccionView } from "@/components/admin/produccion/ProduccionView";

export const metadata = { title: "Producción | Admin" };

function getWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { from: fmt(monday), to: fmt(sunday) };
}

export default async function ProduccionPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const defaults = getWeekRange();
  const from = params.from ?? defaults.from;
  const to = params.to ?? defaults.to;

  const plan = await getProductionPlan(from, to);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-foreground">Producción</h1>
        <p className="text-muted-foreground mt-1">
          Qué preparar y qué materia prima necesitás según los pedidos del período.
        </p>
      </div>
      <ProduccionView plan={plan} from={from} to={to} />
    </div>
  );
}

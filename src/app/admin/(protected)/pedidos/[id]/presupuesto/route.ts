import { renderToBuffer } from "@react-pdf/renderer";
import { getOrder } from "@/lib/actions/pedidos";
import { getSettings } from "@/lib/actions/settings";
import { PresupuestoPDF } from "@/lib/pdf/presupuesto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await getOrder(id).catch(() => null);
  if (!order) return new Response("Pedido no encontrado", { status: 404 });

  const settings = await getSettings().catch(() => ({ deposit_pct: 50 }));

  const buffer = await renderToBuffer(
    PresupuestoPDF({ order, depositPct: settings.deposit_pct })
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Presupuesto-${order.order_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

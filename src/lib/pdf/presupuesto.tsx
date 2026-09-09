import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { NEGOCIO, PRESUPUESTO_VALIDEZ_DIAS } from "@/lib/constants/negocio";
import type { OrderWithItems } from "@/lib/actions/pedidos";

const WINE = "#8B1E3F";
const INK = "#2A2A2A";
const MUTED = "#7A7A7A";
const LINE = "#E4DED7";

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
});

function fecha(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const s = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: INK,
    lineHeight: 1.4,
  },
  brand: { fontSize: 22, fontFamily: "Helvetica-Bold", color: WINE, lineHeight: 1 },
  brandSub: { fontSize: 8, color: MUTED, marginTop: 7, letterSpacing: 1 },
  docTitle: {
    marginTop: 24,
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    color: WINE,
  },
  meta: { marginTop: 4, color: MUTED, fontSize: 9 },

  infoRow: { flexDirection: "row", marginTop: 20 },
  infoCol: { flex: 1 },
  label: { fontSize: 8, color: MUTED, letterSpacing: 1, textTransform: "uppercase" },
  value: { fontSize: 11, marginTop: 2 },

  tableHead: {
    flexDirection: "row",
    marginTop: 28,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: WINE,
  },
  th: { fontSize: 8, color: MUTED, letterSpacing: 1, textTransform: "uppercase" },
  row: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  cDesc: { flex: 1, paddingRight: 8 },
  cQty: { width: 44, textAlign: "center" },
  cUnit: { width: 78, textAlign: "right" },
  cSub: { width: 82, textAlign: "right", fontFamily: "Helvetica-Bold" },
  custom: { fontSize: 8, color: MUTED, marginTop: 2 },

  totals: { marginTop: 14, alignItems: "flex-end" },
  totRow: { flexDirection: "row", width: 240, justifyContent: "space-between", paddingVertical: 2 },
  totLabel: { color: MUTED },
  grandRow: {
    flexDirection: "row",
    width: 240,
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: LINE,
  },
  grandLabel: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  grandValue: { fontFamily: "Helvetica-Bold", fontSize: 12, color: WINE },

  pago: {
    marginTop: 24,
    padding: 12,
    backgroundColor: "#FBF6F1",
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pagoItem: { alignItems: "center" },

  nota: { marginTop: 24, fontSize: 9, color: MUTED },

  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: LINE,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: MUTED,
  },
});

export function PresupuestoPDF({
  order,
  depositPct,
}: {
  order: OrderWithItems;
  depositPct: number;
}) {
  const subtotal = Number(order.subtotal);
  const discount = Number(order.discount);
  const total = subtotal - discount;
  const deposit =
    order.deposit_amount != null
      ? Number(order.deposit_amount)
      : Math.round((total * depositPct) / 100);
  const saldo = Math.max(0, total - deposit);
  const depositLabel =
    order.deposit_amount != null &&
    Math.abs(deposit - Math.round((total * depositPct) / 100)) > 1
      ? "Seña"
      : `Seña (${depositPct}%)`;

  return (
    <Document
      title={`Presupuesto ${order.order_number}`}
      author={NEGOCIO.nombre}
    >
      <Page size="A4" style={s.page}>
        <Text style={s.brand}>{NEGOCIO.nombre}</Text>
        <Text style={s.brandSub}>PASTELERÍA ARTESANAL · {NEGOCIO.ubicacion.toUpperCase()}</Text>

        <Text style={s.docTitle}>PRESUPUESTO</Text>
        <Text style={s.meta}>
          N° {order.order_number} · Emitido el{" "}
          {new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
        </Text>

        <View style={s.infoRow}>
          <View style={s.infoCol}>
            <Text style={s.label}>Cliente</Text>
            <Text style={s.value}>{order.customer?.name ?? "—"}</Text>
            {order.customer?.phone ? <Text style={s.meta}>{order.customer.phone}</Text> : null}
          </View>
          <View style={s.infoCol}>
            <Text style={s.label}>Fecha del evento</Text>
            <Text style={s.value}>{fecha(order.event_date)}</Text>
          </View>
          <View style={s.infoCol}>
            <Text style={s.label}>Entrega</Text>
            <Text style={s.value}>{fecha(order.delivery_date)}</Text>
          </View>
        </View>

        <View style={s.tableHead}>
          <Text style={[s.th, s.cDesc]}>Descripción</Text>
          <Text style={[s.th, s.cQty]}>Cant.</Text>
          <Text style={[s.th, s.cUnit]}>P. unit.</Text>
          <Text style={[s.th, s.cSub]}>Subtotal</Text>
        </View>

        {order.items.map((it) => (
          <View key={it.id} style={s.row} wrap={false}>
            <View style={s.cDesc}>
              <Text>{it.description}</Text>
              {it.customization ? <Text style={s.custom}>{it.customization}</Text> : null}
            </View>
            <Text style={s.cQty}>{it.quantity}</Text>
            <Text style={s.cUnit}>{ARS.format(Number(it.unit_price))}</Text>
            <Text style={s.cSub}>{ARS.format(Number(it.quantity) * Number(it.unit_price))}</Text>
          </View>
        ))}

        <View style={s.totals}>
          {discount > 0 ? (
            <>
              <View style={s.totRow}>
                <Text style={s.totLabel}>Subtotal</Text>
                <Text>{ARS.format(subtotal)}</Text>
              </View>
              <View style={s.totRow}>
                <Text style={s.totLabel}>Descuento</Text>
                <Text>−{ARS.format(discount)}</Text>
              </View>
            </>
          ) : null}
          <View style={s.grandRow}>
            <Text style={s.grandLabel}>Total</Text>
            <Text style={s.grandValue}>{ARS.format(total)}</Text>
          </View>
        </View>

        <View style={s.pago}>
          <View style={s.pagoItem}>
            <Text style={s.label}>{depositLabel}</Text>
            <Text style={[s.value, { fontFamily: "Helvetica-Bold" }]}>{ARS.format(deposit)}</Text>
          </View>
          <View style={s.pagoItem}>
            <Text style={s.label}>Saldo a la entrega</Text>
            <Text style={s.value}>{ARS.format(saldo)}</Text>
          </View>
        </View>

        <Text style={s.nota}>
          Presupuesto válido por {PRESUPUESTO_VALIDEZ_DIAS} días. El pedido se
          confirma con el pago de la seña. El saldo se abona al momento de la entrega.
        </Text>

        <View style={s.footer} fixed>
          <Text>{NEGOCIO.nombre} · {NEGOCIO.ubicacion}</Text>
          <Text>{NEGOCIO.instagram}</Text>
        </View>
      </Page>
    </Document>
  );
}

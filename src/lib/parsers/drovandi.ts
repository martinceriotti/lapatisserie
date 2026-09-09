import type { ParsedItem, ParseResult } from "./types";
import { parseArgentine, round2 } from "./utils";

// Formato DROVANDI (texto crudo de unpdf: espacios simples, prefijo "**unidad**"):
//
//   <CODIGO> <DESCRIPCION...> <STOCK> [MARCA] <U/CAJA> <PRECIO>
//
//   0000173 ACEITE DE GIRASOL COSTA DEL SOL CJ4X4.5LTS 72.00 COSTA DEL SOL 4.00 74.817,74
//   0000173U **unidad**ACEITE DE GIRASOL COSTA DEL SOL X4.5LTS 2.00 COSTA DEL SOL 1.00 18.704,43
//   MAIN005 MANTECA INTY 8 X 2.5 KG 59.00 INTY 8.00 207.314,55
//
// - CODIGO: alfanumérico (mayúsculas + dígitos + . - /), largo variable. No siempre
//   son 7 dígitos: "0MAIN04", "MAIN005", "AZ44CTA", "00MYR10", "114/500", "60-54-10".
//   Sufijo "U" = presentación por unidad (vs. caja).
// - STOCK: número con 2 decimales, puede ser negativo ("-2.00", "88.01", "0.00").
// - MARCA: texto (a veces vacío, "0" o ","). Se descarta.
// - U/CAJA: cantidad por caja ("4.00", "12.00", "1.00").
// - PRECIO: formato argentino, incluye IVA → neto = final / (1 + ivaRate).
//
// Se parsea de derecha a izquierda (precio → u/caja → stock) porque la descripción
// tiene largo variable y puede contener números ("X 1.8", "CJ4X4.5LTS").

const ARG_PRICE_AT_END = /(\d{1,3}(?:\.\d{3})*,\d{2})\s*$/;
const TRAILING_NUMBER = /^(.*?)\s+(\d+(?:\.\d+)?)$/;
const TRAILING_STOCK = /^(.*)\s(-?\d+\.\d{2})(?:\s.*)?$/; // greedy → toma el último token n.nn
const UNIDAD_PREFIX = /^\*+\s*unidad\s*\*+\s*/i;

export function parseDrovandi(text: string, ivaRate: number): ParseResult {
  const items: ParsedItem[] = [];
  const warnings: string[] = [];

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim().replace(/\s+/g, " ");
    if (!line) continue;

    // 1. La línea debe terminar en un precio con formato argentino.
    const priceMatch = line.match(ARG_PRICE_AT_END);
    if (!priceMatch) continue;
    const priceFinal = parseArgentine(priceMatch[1]);
    if (priceFinal <= 0) continue;

    // head = "<codigo> <desc> <stock> [marca] <u/caja>"
    const head = line.slice(0, priceMatch.index).trim();

    // 2. Primer token = código. Debe tener algún dígito y no minúsculas
    //    (así se descartan encabezados, categorías y el pie de página).
    const codeSplit = head.match(/^(\S+)\s+(.*)$/);
    if (!codeSplit) continue;
    const sku = codeSplit[1];
    if (!/\d/.test(sku) || /[a-z]/.test(sku)) continue;
    let rest = codeSplit[2]; // "<desc> <stock> [marca] <u/caja>"

    // 3. U/CAJA = último token numérico.
    let ucaja: string | null = null;
    const ucajaMatch = rest.match(TRAILING_NUMBER);
    if (ucajaMatch) {
      rest = ucajaMatch[1];
      ucaja = ucajaMatch[2];
    }

    // 4. STOCK = último token "-?n.nn"; lo que quede antes es la descripción.
    let productName = rest;
    const stockMatch = rest.match(TRAILING_STOCK);
    if (stockMatch) productName = stockMatch[1];

    // 5. Limpiar prefijo "**unidad**" de las filas por unidad.
    const isUnit = /U$/.test(sku);
    productName = productName.replace(UNIDAD_PREFIX, "").trim();
    if (!productName) continue;

    const priceNet = round2(priceFinal / (1 + ivaRate));
    const perBox = ucaja ? parseInt(ucaja, 10) : 0;
    const unitDescription = isUnit
      ? "Unidad"
      : perBox > 1
        ? `Caja x ${perBox}`
        : "Caja";

    items.push({
      supplier_sku: sku,
      product_name: productName,
      unit_description: unitDescription,
      price_net: priceNet,
      price_final: round2(priceFinal),
    });
  }

  // Deduplicar: si un SKU se repite (encabezado/pie), gana el último.
  const seen = new Map<string, ParsedItem>();
  for (const item of items) seen.set(item.supplier_sku, item);
  const deduped = [...seen.values()];

  if (deduped.length === 0) {
    warnings.push(
      "No se encontraron filas con el formato Drovandi. Revisá el PDF en el texto crudo."
    );
  }

  return { items: deduped, rawText: text, warnings };
}

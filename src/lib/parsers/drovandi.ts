import type { ParsedItem, ParseResult } from "./types";
import { parseArgentine, round2 } from "./utils";

// DROVANDI format:
// CODIGO | DESCRIPCION | STOCK | MARCA | U/CAJA | PRECIO
// Example: "0003290 ACEITE OLIVA X 5LT 15 COCINERO 4 162.593,60"
// Example: "0003290U ACEITE OLIVA X 5LT 0 COCINERO 1 40.648,40"
// Codes are 7 digits, optionally with "U" suffix (unidad vs caja)
// PRECIO includes IVA → compute net = final / (1 + ivaRate)

export function parseDrovandi(text: string, ivaRate: number): ParseResult {
  const items: ParsedItem[] = [];
  const warnings: string[] = [];

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();

    // Must start with 7-digit code, optionally with U suffix
    const skuMatch = line.match(/^(\d{7}(U?))\b/);
    if (!skuMatch) continue;

    const sku = skuMatch[1];
    const isUnit = skuMatch[2] === "U";

    // Find all Argentine-format prices in the line; last one is the price
    const allPrices = [...line.matchAll(/\b(\d{1,3}(?:\.\d{3})*,\d{2})\b/g)];
    if (allPrices.length === 0) continue;

    const priceFinal = parseArgentine(allPrices[allPrices.length - 1][1]);
    if (priceFinal <= 0) continue;

    const priceNet = round2(priceFinal / (1 + ivaRate));

    // Try to extract U/CAJA count (number just before the last price)
    const ucajaMatch = line.match(/\b(\d+)\s+\d{1,3}(?:\.\d{3})*,\d{2}\s*$/);
    const ucaja = ucajaMatch ? ucajaMatch[1] : null;
    const unitDescription = isUnit ? "Unidad" : ucaja && ucaja !== "0" ? `Caja x ${ucaja}` : "Caja";

    // Extract description: after SKU code, before the first standalone number (stock)
    const rest = line.slice(sku.length).trim();
    // Description ends at the first sequence of multiple spaces or a standalone number
    const descMatch = rest.match(/^(.+?)\s{2,}\S|\s+\d+\s+\S/);
    let productName: string;
    if (descMatch) {
      productName = descMatch[1]?.trim() ?? rest.split(/\s{2,}/)[0].trim();
    } else {
      // Fallback: take tokens until we hit a short numeric token (stock number)
      const tokens = rest.split(/\s+/);
      const nameTokens: string[] = [];
      for (const t of tokens) {
        if (/^\d{1,6}$/.test(t) && nameTokens.length > 0) break;
        if (/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(t)) break;
        nameTokens.push(t);
      }
      productName = nameTokens.join(" ").trim();
    }

    if (!productName) continue;

    items.push({ supplier_sku: sku, product_name: productName, unit_description: unitDescription, price_net: priceNet, price_final: round2(priceFinal) });
  }

  // Deduplicate: if same SKU appears more than once (e.g. repeated in header/footer), last wins
  const seen = new Map<string, ParsedItem>();
  for (const item of items) seen.set(item.supplier_sku, item);
  const deduped = [...seen.values()];

  if (deduped.length === 0) {
    warnings.push("No se encontraron filas con el formato Drovandi. Revisá el PDF en el texto crudo.");
  }

  return { items: deduped, rawText: text, warnings };
}

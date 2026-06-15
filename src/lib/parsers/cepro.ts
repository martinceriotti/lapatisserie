import type { ParsedItem, ParseResult } from "./types";
import { parseUS, round2 } from "./utils";

// CEPRO actual extracted format (unpdf output):
// $ PRICE_NET $ PRICE_FINALCondiciónProducto nameSKU
//
// Example:
//   "$ 5,196.04 $ 6,287.21ContadoAlf. Santafesino Triple x 12 un. - Deubel (6)030213"
//   "$ 1,264.18 $ 1,529.66ContadoLeche LS Desc Sachet x 1lt *010731"
//
// Notes:
// - Prices use US format (comma=thousands, period=decimal) with $ sign
// - Condition word ("Contado", "Credito", etc.) is concatenated to the last price
// - SKU is 6 digits at the very end of the line (no space before it)
// - Some products have an asterisk (*) that's part of the name — strip it
// - Category headers ("Quesos (101002)") don't start with $ — automatically skipped

export function parseCepro(text: string): ParseResult {
  const warnings: string[] = [];
  const seen = new Map<string, ParsedItem>();

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();

    // Must start with two US-format prices
    const priceMatch = line.match(/^\$\s*([\d,]+\.\d{2})\s+\$\s*([\d,]+\.\d{2})/);
    if (!priceMatch) continue;

    const priceNet = parseUS(priceMatch[1]);
    const priceFinal = parseUS(priceMatch[2]);
    if (priceNet <= 0 || priceFinal <= 0) continue;

    // SKU: 6 digits anchored at the end of the line
    const skuMatch = line.match(/(\d{6})\s*$/);
    if (!skuMatch) continue;
    const sku = skuMatch[1];
    const skuIdx = line.lastIndexOf(sku);

    // Middle section: condition word + product name
    const middle = line.slice(priceMatch[0].length, skuIdx).trim();

    // First word is the condition (Contado / Credito / Especial / etc.)
    const condMatch = middle.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s*/);
    if (!condMatch) continue;

    const productName = middle
      .slice(condMatch[0].length)
      .trim()
      .replace(/\*\s*$/, "") // remove trailing asterisk (alternative-code marker)
      .trim();

    if (!productName || productName.length < 2) continue;

    seen.set(sku, {
      supplier_sku: sku,
      product_name: productName,
      price_net: round2(priceNet),
      price_final: round2(priceFinal),
    });
  }

  const items = [...seen.values()];

  if (items.length === 0) {
    warnings.push(
      "No se encontraron filas con el formato CEPRO. Revisá el PDF en el texto crudo."
    );
  }

  return { items, rawText: text, warnings };
}

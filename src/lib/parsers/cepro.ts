import type { ParsedItem, ParseResult } from "./types";
import { parseArgentine, round2 } from "./utils";

// CEPRO format:
// Código | Alternativo | Producto | Condición | Precio Neto | Precio Final
// Example: "50203 50204 MANTECA INTY X 5 KG Sin 16.992,14 19.790,00"
// SKU = 5 digits, both prices already in the PDF (net and final)

export function parseCepro(text: string): ParseResult {
  const items: ParsedItem[] = [];
  const warnings: string[] = [];

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();

    // Must start with a 5-digit SKU
    const skuMatch = line.match(/^(\d{5})\b/);
    if (!skuMatch) continue;

    const sku = skuMatch[1];

    // Find all Argentine-format prices on this line
    const allPrices = [...line.matchAll(/\b(\d{1,3}(?:\.\d{3})*,\d{2})\b/g)];
    if (allPrices.length < 2) continue;

    const priceNet = parseArgentine(allPrices[allPrices.length - 2][1]);
    const priceFinal = parseArgentine(allPrices[allPrices.length - 1][1]);
    if (priceNet <= 0 || priceFinal <= 0) continue;

    // Extract product name: text after SKU (and optional alt SKU), before the first price
    const rest = line.slice(sku.length).trim();
    const withoutAltSku = rest.replace(/^\d{5}\s+/, "");
    const firstPriceIdx = withoutAltSku.search(/\d{1,3}(?:\.\d{3})*,\d{2}/);
    if (firstPriceIdx < 0) continue;

    // Remove the trailing "Condición" word (e.g., "Sin", "Con")
    const nameAndCondition = withoutAltSku.slice(0, firstPriceIdx).trim();
    const tokens = nameAndCondition.split(/\s+/);
    if (tokens.length > 1) tokens.pop();
    const productName = tokens.join(" ").trim();
    if (!productName) continue;

    items.push({ supplier_sku: sku, product_name: productName, price_net: round2(priceNet), price_final: round2(priceFinal) });
  }

  if (items.length === 0) {
    warnings.push("No se encontraron filas con el formato CEPRO. Revisá el PDF en el texto crudo.");
  }

  return { items, rawText: text, warnings };
}

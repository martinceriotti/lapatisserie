import type { ParsedItem, ParseResult } from "./types";
import { parseArgentine, round2 } from "./utils";

// PIRA format — Argentine price list, simple table: CODE PRODUCT_NAME $PRICE [XKG]
//
// CODE: 3-digit number (101, 102, ...)
// PRICE: Argentine thousands separator, period only, no decimals  → $207.600 = $207,600 ARS
// XKG: optional suffix meaning "price per kg"
//
// Lines without a price (sin stock / consultar) have no "$" → skipped by regex.
// Category headers (all-caps, no numeric code) also don't match → skipped.
//
// The listed price is treated as net; IVA is added to produce price_final.

const PRODUCT_RE = /^(\d{3})\s+(.+?)\s+\$\s*([\d.]+)\s*(XKG)?\s*$/i;

export function parsePira(text: string, ivaRate: number): ParseResult {
  const warnings: string[] = [];
  const seen = new Map<string, ParsedItem>();

  // Pre-join: if a "CODE NAME" line has no price but the next line is "$PRICE", merge them.
  // This handles PDFs where the right-column price is extracted on a separate line.
  const rawLines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const lines: string[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (/^\d{3}\s/.test(line) && !line.includes("$")) {
      const next = rawLines[i + 1] ?? "";
      if (/^\$\s*[\d.]+/.test(next)) {
        lines.push(line + " " + next);
        i++;
        continue;
      }
    }
    lines.push(line);
  }

  for (const line of lines) {
    const m = line.match(PRODUCT_RE);
    if (!m) continue;

    const sku = m[1];
    const productName = m[2].trim();
    const priceStr = m[3];
    const isPerKg = !!m[4];

    if (!productName || productName.length < 2) continue;

    const priceNet = parseArgentine(priceStr);
    if (priceNet <= 0) continue;

    seen.set(sku, {
      supplier_sku: sku,
      product_name: productName,
      unit_description: isPerKg ? "precio por kg" : undefined,
      price_net: round2(priceNet),
      price_final: round2(priceNet * (1 + ivaRate)),
    });
  }

  const items = [...seen.values()];
  if (items.length === 0) {
    warnings.push(
      "No se encontraron productos con el formato PIRA. Revisá el texto crudo del PDF."
    );
  }

  return { items, rawText: text, warnings };
}

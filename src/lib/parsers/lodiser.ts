import type { ParsedItem, ParseResult } from "./types";
import { parseUS, round2 } from "./utils";

// LODISER format:
// PRODUCTO | ENVASE | CODIGO DE PRODUCTO | PRECIO (SIN IMPUESTOS)
// Example: "CHOCOLATE CALLEBAUT 811  BOLSA 1KG  CAT70  $ 13,950.00"
// Codes: 2-6 uppercase letters followed by 1-4 digits (e.g., CAT70, ACE14, COS801)
// Prices are WITHOUT IVA → compute final = net * (1 + ivaRate)

// Lodiser code pattern: 2-6 uppercase letters + 1-4 digits
const LODISER_CODE_RE = /\b([A-Z]{2,6}\d{1,4})\b/;

// US-format price at end of line: $ 13,950.00 or $1,234.56
const US_PRICE_RE = /\$\s*([\d,]+\.\d{2})\s*$/;

export function parseLodiser(text: string, ivaRate: number): ParseResult {
  const items: ParsedItem[] = [];
  const warnings: string[] = [];

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();

    // Must end with a US-format price
    const priceMatch = line.match(US_PRICE_RE);
    if (!priceMatch) continue;

    const priceNet = parseUS(priceMatch[1]);
    if (priceNet <= 0) continue;

    // Must contain a Lodiser product code
    const codeMatch = line.match(LODISER_CODE_RE);
    if (!codeMatch) continue;

    const sku = codeMatch[1];
    const priceFinal = round2(priceNet * (1 + ivaRate));

    // Product name + envase = everything before the code
    const codeIdx = line.indexOf(codeMatch[0]);
    const beforeCode = line.slice(0, codeIdx).trim();

    // Split on 2+ spaces to separate "PRODUCTO  ENVASE"
    const parts = beforeCode.split(/\s{2,}/);
    const productName = (parts[0] ?? beforeCode).trim();
    const unitDescription = parts.slice(1).join(" ").trim() || undefined;

    if (!productName) continue;

    items.push({ supplier_sku: sku, product_name: productName, unit_description: unitDescription, price_net: round2(priceNet), price_final: priceFinal });
  }

  if (items.length === 0) {
    warnings.push("No se encontraron filas con el formato Lodiser. Revisá el PDF en el texto crudo.");
  }

  return { items, rawText: text, warnings };
}

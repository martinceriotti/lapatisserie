import type { ParsedItem, ParseResult } from "./types";
import { parseUS, round2 } from "./utils";

// LODISER format:
// PRODUCTO | ENVASE | CODIGO DE PRODUCTO | PRECIO (SIN IMPUESTOS)
//
// In the extracted text, multi-line products look like:
//   JALEA FANTASIA BRILLO
//   (CALIENTE) LODISER / KEWEY  BALDE 13 KG  JAL16 / JAL04  $ 28,350.00
//
// The code and price are always on the same line.
// Codes can be:
//   - alphanumeric: JAL16, ACE04, CAT70
//   - dual: JAL16 / JAL04 (use the first one)
//   - pure alpha: INN, MAR (no digits)
//
// The line ending with "CODE $ PRICE" contains the code + price (and some envase/product words).
// If that content before the code starts with "(" it's a continuation — prepend the previous line.

// Matches: "CODE $ 12,345.00" or "CODE / CODE2 $ 12,345.00" at end of line
// Code: 2-8 uppercase letters optionally followed by 0-4 digits
const LINE_RE =
  /\b([A-Z]{2,8}\d{0,4})(?:\s*\/\s*[A-Z]{2,8}\d{0,4})?\s+\$\s*([\d,]+\.\d{2})\s*$/;

// Words that should NOT be treated as codes (common Spanish words / units that appear before prices)
const NOT_CODES = new Set(["KG", "KGS", "UN", "UNI", "LT", "LTS", "CC", "GR", "ML", "MG"]);

export function parseLodiser(text: string, ivaRate: number): ParseResult {
  const items: ParsedItem[] = [];
  const warnings: string[] = [];
  const seen = new Map<string, ParsedItem>();

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const m = line.match(LINE_RE);
    if (!m) continue;

    const sku = m[1];
    if (NOT_CODES.has(sku)) continue;

    const priceNet = parseUS(m[2]);
    if (priceNet <= 0) continue;

    const priceFinal = round2(priceNet * (1 + ivaRate));

    // Everything before "CODE / ... $ PRICE" on this line
    const matchStart = line.lastIndexOf(m[0].trimStart());
    const beforeCode = matchStart > 0 ? line.slice(0, matchStart).trim() : "";

    // If beforeCode is very short or starts with "(", this line is a continuation:
    // the real product name starts on the previous non-empty line
    let fullProductText = beforeCode;
    if (i > 0 && (beforeCode.length < 4 || beforeCode.startsWith("("))) {
      const prevLine = lines[i - 1];
      // Only prepend if previous line doesn't look like a section header or table header
      if (!/^(PRODUCTO|ENVASE|CODIGO|PRECIO|GASTRONOMIA|MONOPORCIONES|LACTEOS|UNILEVER|POLVOS|ESPECIAS|REPOSTERIA|CEREALES|PANADERIA|HARINAS|ACEITES|CONDIMENTOS|CHOCOLATES|DULCES|SALSAS)/i.test(prevLine)) {
        fullProductText = prevLine + (beforeCode ? " " + beforeCode : "");
      }
    }

    if (!fullProductText || fullProductText.length < 2) continue;

    // Try to split "PRODUCT NAME   ENVASE" on 2+ spaces
    const parts = fullProductText.split(/\s{2,}/);
    const productName = (parts[0] ?? fullProductText).trim();
    const unitDescription = parts.slice(1).join(" ").trim() || undefined;

    const item: ParsedItem = {
      supplier_sku: sku,
      product_name: productName,
      unit_description: unitDescription,
      price_net: round2(priceNet),
      price_final: priceFinal,
    };

    // Last occurrence wins for duplicates
    seen.set(sku, item);
  }

  const result = [...seen.values()];

  if (result.length === 0) {
    warnings.push("No se encontraron productos con el formato Lodiser. Revisá el PDF en el texto crudo.");
  }

  return { items: result, rawText: text, warnings };
}

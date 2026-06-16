import type { ParsedItem, ParseResult } from "./types";
import { parseUS, round2 } from "./utils";

// LODISER format (multi-column PDF extracted left-to-right):
// PRODUCTO | ENVASE | CODIGO | PRECIO (SIN IMPUESTOS)
//
// Product names can span 1-4 lines; code and price are ALWAYS on the last line.
// Strategy: two-pass — find all "anchor" lines (ending with CODE $ PRICE),
// then for each anchor collect all lines above it (back to the previous anchor
// or a section header) as the product text.

const LINE_RE =
  /\b([A-Z]{2,8}\d{0,4})(?:\s*\/\s*[A-Z]{2,8}\d{0,4})?\s+\$\s*([\d,]+\.\d{2})\s*$/;

const NOT_CODES = new Set(["KG", "KGS", "UN", "UNI", "LT", "LTS", "CC", "GR", "ML", "MG"]);

// Section/table headers that mark the boundary between product blocks
const SECTION_RE =
  /^(PRODUCTO|ENVASE|CODIGO|PRECIO|GASTRONOMIA|MONOPORCIONES|LACTEOS|UNILEVER|POLVOS|ESPECIAS|REPOSTERIA|CEREALES|PANADERIA|HARINAS|ACEITES|CONDIMENTOS|CHOCOLATES|DULCES|SALSAS|MERMELADAS|AZUCARES|HUEVOS|LEVADURAS|GELATINAS|AROMAS|COLORANTES|VINOS|BEBIDAS|CONSERVAS|CARNES|AVES|PESCADOS|PASTAS)/i;

type Anchor = { idx: number; sku: string; priceStr: string; beforeCode: string };

export function parseLodiser(text: string, ivaRate: number): ParseResult {
  const seen = new Map<string, ParsedItem>();
  const warnings: string[] = [];

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Pass 1: identify anchor lines
  const anchors: Anchor[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(LINE_RE);
    if (!m) continue;
    const sku = m[1];
    if (NOT_CODES.has(sku)) continue;
    if (parseUS(m[2]) <= 0) continue;
    const matchIdx = m.index ?? 0;
    const beforeCode = matchIdx > 0 ? lines[i].slice(0, matchIdx).trim() : "";
    anchors.push({ idx: i, sku, priceStr: m[2], beforeCode });
  }

  // Pass 2: for each anchor, collect preceding lines as product text
  for (let a = 0; a < anchors.length; a++) {
    const { idx, sku, priceStr, beforeCode } = anchors[a];
    const prevAnchorIdx = a > 0 ? anchors[a - 1].idx : -1;

    const textParts: string[] = [];
    for (let j = idx - 1; j > prevAnchorIdx; j--) {
      if (SECTION_RE.test(lines[j])) break;
      textParts.unshift(lines[j]);
    }
    if (beforeCode) textParts.push(beforeCode);

    const fullProductText = textParts.join(" ").trim();
    if (!fullProductText || fullProductText.length < 2) continue;

    const priceNet = parseUS(priceStr);
    const priceFinal = round2(priceNet * (1 + ivaRate));

    // Try to split product name from envase on 2+ consecutive spaces
    const parts = fullProductText.split(/\s{2,}/);
    const productName = parts[0].trim();
    const unitDescription = parts.slice(1).join(" ").trim() || undefined;

    seen.set(sku, {
      supplier_sku: sku,
      product_name: productName,
      unit_description: unitDescription,
      price_net: round2(priceNet),
      price_final: priceFinal,
    });
  }

  const result = [...seen.values()];
  if (result.length === 0) {
    warnings.push(
      "No se encontraron productos con el formato Lodiser. Revisá el PDF en el texto crudo."
    );
  }

  return { items: result, rawText: text, warnings };
}

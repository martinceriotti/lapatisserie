import type { ParsedItem, ParseResult } from "./types";
import { parseUS, round2 } from "./utils";

// LODISER format (multi-column PDF extracted left-to-right):
// Product names can span 1-4 lines; price always closes the last line.
// We ignore the supplier code entirely and generate an internal slug SKU.
//
// Strategy: two-pass.
//   Pass 1: find all "anchor" lines — those ending with $ PRICE.
//   Pass 2: for each anchor, walk backwards collecting lines up to the
//           previous anchor or a section header to build the full product text.

const PRICE_RE = /\$\s*([\d,]+\.\d{2})\s*$/;

const SECTION_RE =
  /^(PRODUCTO|ENVASE|CODIGO|PRECIO|IMPUESTOS|GASTRONOMIA|MONOPORCIONES|LACTEOS|UNILEVER|POLVOS|ESPECIAS|REPOSTERIA|CEREALES|PANADERIA|HARINAS|ACEITES|CONDIMENTOS|CHOCOLATES|DULCES|SALSAS|MERMELADAS|AZUCARES|HUEVOS|LEVADURAS|GELATINAS|AROMAS|COLORANTES|VINOS|BEBIDAS|CONSERVAS|CARNES|AVES|PESCADOS|PASTAS|FRUTAS|FRUTOS|SEMILLAS|PAILADOS|GRASAS|MARGARINAS|OTROS|RELLENOS|COBERTURAS|VARIEGATTOS|ELABORACION|ARTESANAL)/i;

function toSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type Anchor = { idx: number; priceStr: string; beforeDollar: string };

export function parseLodiser(text: string, ivaRate: number): ParseResult {
  const seen = new Map<string, ParsedItem>();
  const warnings: string[] = [];

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Pass 1: identify anchor lines (ending with $ PRICE)
  const anchors: Anchor[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(PRICE_RE);
    if (!m) continue;
    const dollarIdx = lines[i].lastIndexOf("$");
    const beforeDollar = dollarIdx > 0 ? lines[i].slice(0, dollarIdx).trim() : "";
    anchors.push({ idx: i, priceStr: m[1], beforeDollar });
  }

  // Pass 2: for each anchor, collect preceding lines as product text
  for (let a = 0; a < anchors.length; a++) {
    const { idx, priceStr, beforeDollar } = anchors[a];
    const prevAnchorIdx = a > 0 ? anchors[a - 1].idx : -1;

    const textParts: string[] = [];
    for (let j = idx - 1; j > prevAnchorIdx; j--) {
      if (SECTION_RE.test(lines[j])) break;
      // Skip lines that are clearly page headers/footers (contain lowercase)
      if (/[a-záéíóúñ]/.test(lines[j])) continue;
      textParts.unshift(lines[j]);
    }
    if (beforeDollar) textParts.push(beforeDollar);

    const fullProductText = textParts.join(" ").trim();
    if (!fullProductText || fullProductText.length < 3) continue;

    const priceNet = parseUS(priceStr);
    if (priceNet <= 0) continue;

    const sku = toSlug(fullProductText);
    if (!sku) continue;

    seen.set(sku, {
      supplier_sku: sku,
      product_name: fullProductText,
      unit_description: undefined,
      price_net: round2(priceNet),
      price_final: round2(priceNet * (1 + ivaRate)),
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

// Argentine number format: "16.992,14" → 16992.14
export function parseArgentine(s: string): number {
  return parseFloat(s.replace(/\./g, "").replace(",", "."));
}

// US number format: "$13,950.00" or "13,950.00" → 13950.00
export function parseUS(s: string): number {
  return parseFloat(s.replace(/[$\s]/g, "").replace(/,/g, ""));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Matches Argentine-format price like "16.992,14" or "1.234,56"
export const ARG_PRICE_RE = /\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g;

// Matches US-format price like "$13,950.00" or "$ 1,234.56"
export const US_PRICE_RE = /\$\s*[\d,]+\.\d{2}/g;

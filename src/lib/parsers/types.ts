export interface ParsedItem {
  supplier_sku: string;
  product_name: string;
  unit_description?: string;
  price_net: number;
  price_final: number;
}

export interface ParseResult {
  items: ParsedItem[];
  rawText: string;
  warnings: string[];
}

export type ParserType = "cepro" | "drovandi" | "lodiser" | "pira";

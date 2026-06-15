import type { ParseResult, ParserType } from "./types";
import { parseCepro } from "./cepro";
import { parseDrovandi } from "./drovandi";
import { parseLodiser } from "./lodiser";

export function parseSupplierList(
  text: string,
  parserType: ParserType,
  ivaRate: number
): ParseResult {
  switch (parserType) {
    case "cepro":
      return parseCepro(text);
    case "drovandi":
      return parseDrovandi(text, ivaRate);
    case "lodiser":
      return parseLodiser(text, ivaRate);
  }
}

export type { ParsedItem, ParseResult, ParserType } from "./types";

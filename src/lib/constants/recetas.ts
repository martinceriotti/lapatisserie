export const RECIPE_YIELD_UNITS = ["unidades", "porciones", "gramos", "kg"] as const;
export const RECIPE_DIFFICULTIES = ["facil", "medio", "dificil"] as const;

export const YIELD_UNIT_LABELS: Record<string, string> = {
  unidades: "unidades",
  porciones: "porciones",
  gramos: "gramos",
  kg: "kg",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  facil: "Fácil",
  medio: "Media",
  dificil: "Difícil",
};

// Maps a raw_material unit to the base unit used in recipe_ingredients
// The recipe_costs VIEW multiplies quantity * price_per_gram, so we normalize:
//   g/kg  → store quantity in grams
//   ml/l  → store quantity in ml
//   discrete (unidad/sobre/taza) → store in natural units
export function toRecipeUnit(mpUnit: string): string {
  if (mpUnit === "kg" || mpUnit === "g") return "g";
  if (mpUnit === "l" || mpUnit === "ml") return "ml";
  return mpUnit;
}

export const RECIPE_UNIT_LABELS: Record<string, string> = {
  g: "g",
  ml: "ml",
  unidad: "unid.",
  sobre: "sobre",
  taza: "taza",
};

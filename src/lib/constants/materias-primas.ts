export const UNITS = ["g", "kg", "ml", "l", "unidad", "sobre", "taza"] as const;
export const CATEGORIES = ["dairy", "flour", "chocolate", "sugar", "fruit", "packaging", "other"] as const;

export const CATEGORY_LABELS: Record<typeof CATEGORIES[number], string> = {
  dairy: "Lácteos",
  flour: "Harinas",
  chocolate: "Chocolate",
  sugar: "Azúcares",
  fruit: "Frutas",
  packaging: "Packaging",
  other: "Otros",
};

export const UNIT_LABELS: Record<typeof UNITS[number], string> = {
  g: "g (gramos)",
  kg: "kg (kilogramos)",
  ml: "ml (mililitros)",
  l: "L (litros)",
  unidad: "Unidad",
  sobre: "Sobre",
  taza: "Taza",
};

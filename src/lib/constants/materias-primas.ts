export const UNITS = ["g", "kg", "ml", "l", "unidad", "sobre", "taza"] as const;
export const CATEGORIES = ["dairy", "eggs", "flour", "chocolate", "sugar", "fruit", "nuts", "powders", "packaging", "other"] as const;

export const CATEGORY_LABELS: Record<typeof CATEGORIES[number], string> = {
  dairy: "Lácteos",
  eggs: "Huevos",
  flour: "Harinas",
  chocolate: "Chocolate",
  sugar: "Azúcares",
  fruit: "Frutas",
  nuts: "Frutos Secos",
  powders: "Polvos",
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

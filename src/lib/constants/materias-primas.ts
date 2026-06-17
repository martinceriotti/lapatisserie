export const UNITS = ["g", "kg", "ml", "l", "unidad", "sobre", "taza"] as const;

export const INGREDIENT_CATEGORIES = [
  "dairy", "eggs", "flour", "chocolate", "sugar", "fruit", "nuts", "powders", "packaging", "other",
] as const;

export const PRODUCT_CATEGORIES = [
  "tortas", "alfajores", "budines", "galletitas", "masas", "otros_productos",
] as const;

export const CATEGORIES = [...INGREDIENT_CATEGORIES, ...PRODUCT_CATEGORIES] as const;

export const MATERIAL_TYPES = ["materia_prima", "intermedio", "producto_terminado"] as const;

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
  tortas: "Tortas",
  alfajores: "Alfajores",
  budines: "Budines",
  galletitas: "Galletitas",
  masas: "Masas",
  otros_productos: "Otros productos",
};

export const MATERIAL_TYPE_LABELS: Record<typeof MATERIAL_TYPES[number], string> = {
  materia_prima: "Materia prima",
  intermedio: "Intermedio",
  producto_terminado: "Producto terminado",
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

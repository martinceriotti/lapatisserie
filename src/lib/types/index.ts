// ─── Raw Materials ───────────────────────────────────────────────────────────

export type RawMaterialUnit =
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "unidad"
  | "sobre"
  | "taza";

export type RawMaterialCategory =
  | "dairy"
  | "flour"
  | "chocolate"
  | "sugar"
  | "fruit"
  | "packaging"
  | "other";

export interface RawMaterial {
  id: string;
  name: string;
  description: string | null;
  unit: RawMaterialUnit;
  category: RawMaterialCategory;
  current_price: number;
  price_per_gram: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RawMaterialPriceHistory {
  id: string;
  raw_material_id: string;
  price: number;
  effective_date: string;
  notes: string | null;
  created_at: string;
}

// ─── Recipes ─────────────────────────────────────────────────────────────────

export type RecipeYieldUnit = "unidades" | "porciones" | "gramos" | "kg";
export type RecipeDifficulty = "facil" | "medio" | "dificil";

export interface RecipeCategory {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

export interface Recipe {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  yield_quantity: number;
  yield_unit: RecipeYieldUnit;
  prep_time_min: number | null;
  difficulty: RecipeDifficulty | null;
  notes: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  category?: RecipeCategory;
  ingredients?: RecipeIngredient[];
  cost?: RecipeCost;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  raw_material_id: string;
  quantity: number;
  unit: RawMaterialUnit;
  notes: string | null;
  // Relations
  raw_material?: RawMaterial;
}

export interface RecipeCost {
  recipe_id: string;
  ingredient_cost: number;
  overhead_cost: number;
  total_cost: number;
  cost_per_unit: number;
}

// ─── Products ────────────────────────────────────────────────────────────────

export type PriceDisplay = "from" | "consult" | "fixed";

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  image_url: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category_id: string | null;
  recipe_id: string | null;
  base_price: number | null;
  price_display: PriceDisplay;
  min_order_qty: number;
  is_featured: boolean;
  is_active: boolean;
  images: string[];
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  category?: ProductCategory;
  recipe?: Recipe;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  additional_cost: number;
  price_override: number | null;
  is_active: boolean;
}

// ─── Overhead ────────────────────────────────────────────────────────────────

export type OverheadType = "percentage" | "fixed_amount";

export interface OverheadSetting {
  id: string;
  name: string;
  type: OverheadType;
  value: number;
  is_active: boolean;
}

// ─── Customers ───────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  neighborhood: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "borrador"
  | "presupuestado"
  | "confirmado"
  | "en_produccion"
  | "listo"
  | "entregado"
  | "pagado"
  | "cancelado";

export type PaymentStatus = "pending" | "partial" | "paid";

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  event_date: string | null;
  delivery_date: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  customer?: Customer;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  customization: string | null;
  notes: string | null;
  // Relations
  product?: Product;
  variant?: ProductVariant;
}

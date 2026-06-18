"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import type { OrderStatus, PaymentStatus } from "@/lib/constants/pedidos";
export type { OrderStatus, PaymentStatus } from "@/lib/constants/pedidos";

export type ActionResult = { success: true } | { error: Record<string, string[]> | string };

// ── Types ──────────────────────────────────────────────────────────────────────

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  neighborhood: string | null;
  notes: string | null;
  created_at: string;
};

export type ProductForOrder = {
  id: string;
  name: string;
  sale_price: number | null;
  type: "product" | "recipe";
};

export type OrderItem = {
  id: string;
  order_id: string;
  raw_material_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  customization: string | null;
  notes: string | null;
  raw_material: { id: string; name: string } | null;
};

export type Order = {
  id: string;
  order_number: string;
  customer_id: string;
  event_date: string | null;
  delivery_date: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number | null;
  deposit_amount: number | null;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer: Customer | null;
};

export type OrderSummary = Order & { item_count: number };
export type OrderWithItems = Order & { items: OrderItem[] };

// ── Private helpers ────────────────────────────────────────────────────────────

async function recalcTotals(supabase: ReturnType<typeof createAdminClient>, orderId: string) {
  const { data: items } = await supabase
    .from("order_items")
    .select("quantity, unit_price")
    .eq("order_id", orderId);

  const subtotal = (items ?? []).reduce(
    (sum, i) => sum + Number(i.quantity) * Number(i.unit_price),
    0
  );

  await supabase
    .from("orders")
    .update({ subtotal, updated_at: new Date().toISOString() })
    .eq("id", orderId);
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getProductsForOrder(): Promise<ProductForOrder[]> {
  const supabase = createAdminClient();

  const [{ data: products }, { data: recipes }, { data: costs }, { data: settings }] = await Promise.all([
    supabase
      .from("raw_materials")
      .select("id, name, sale_price")
      .eq("material_type", "producto_terminado")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("recipes")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("recipe_costs")
      .select("recipe_id, cost_per_unit"),
    supabase
      .from("app_settings")
      .select("sale_price_factor")
      .limit(1)
      .maybeSingle(),
  ]);

  const salePriceFactor = settings?.sale_price_factor ?? 3;
  const costByRecipe = new Map((costs ?? []).map((c) => [c.recipe_id, c.cost_per_unit]));

  const productItems: ProductForOrder[] = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    sale_price: p.sale_price,
    type: "product" as const,
  }));

  const recipeItems: ProductForOrder[] = (recipes ?? []).map((r) => {
    const costPerUnit = costByRecipe.get(r.id);
    const suggestedPrice = costPerUnit != null
      ? Math.round(costPerUnit * salePriceFactor)
      : null;
    return {
      id: r.id,
      name: r.name,
      sale_price: suggestedPrice,
      type: "recipe" as const,
    };
  });

  return [...productItems, ...recipeItems];
}

export async function getOrders(): Promise<OrderSummary[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, customer_id, event_date, delivery_date,
      status, subtotal, discount, total, deposit_amount,
      payment_status, notes, created_at, updated_at,
      customer:customers(id, name, phone, email, address, neighborhood, notes, created_at),
      items:order_items(id)
    `)
    .order("delivery_date", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((o) => ({
    ...(o as unknown as Order),
    item_count: Array.isArray(o.items) ? o.items.length : 0,
  }));
}

export async function getOrder(id: string): Promise<OrderWithItems> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, customer_id, event_date, delivery_date,
      status, subtotal, discount, total, deposit_amount,
      payment_status, notes, created_at, updated_at,
      customer:customers(id, name, phone, email, address, neighborhood, notes, created_at),
      items:order_items(
        id, order_id, raw_material_id, description, quantity, unit_price,
        customization, notes,
        raw_material:raw_materials(id, name)
      )
    `)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as OrderWithItems;
}

// ── Customer mutations ─────────────────────────────────────────────────────────

const customerSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(200),
  phone: z.string().max(30).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().max(300).optional(),
  neighborhood: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export async function createCustomer(
  _prev: (ActionResult & { id?: string }) | null,
  formData: FormData
): Promise<ActionResult & { id?: string }> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = customerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .insert([{
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      neighborhood: parsed.data.neighborhood || null,
      notes: parsed.data.notes || null,
    }])
    .select("id")
    .single();
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/pedidos");
  return { success: true, id: data.id };
}

// ── Order mutations ────────────────────────────────────────────────────────────

const orderSchema = z.object({
  customer_id: z.string().uuid("Cliente requerido"),
  event_date: z.string().optional().or(z.literal("")),
  delivery_date: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
});

export async function createOrder(
  _prev: (ActionResult & { id?: string }) | null,
  formData: FormData
): Promise<ActionResult & { id?: string }> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .insert([{
      customer_id: parsed.data.customer_id,
      event_date: parsed.data.event_date || null,
      delivery_date: parsed.data.delivery_date || null,
      notes: parsed.data.notes || null,
      status: "borrador",
      subtotal: 0,
      discount: 0,
      payment_status: "pending",
    }])
    .select("id")
    .single();
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/pedidos");
  return { success: true, id: data.id };
}

export async function updateOrderMeta(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({
      customer_id: parsed.data.customer_id,
      event_date: parsed.data.event_date || null,
      delivery_date: parsed.data.delivery_date || null,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: { _: [error.message] } };

  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/pedidos");
  return { success: true };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  // Deduct finished product stock when order is delivered
  if (status === "entregado") {
    const { data: items } = await supabase
      .from("order_items")
      .select("quantity, raw_material_id, description, raw_material:raw_materials(stock_quantity)")
      .eq("order_id", id)
      .not("raw_material_id", "is", null);

    for (const item of items ?? []) {
      if (!item.raw_material_id) continue;
      const rm = item.raw_material as any;
      const qty = Number(item.quantity);
      const current = Number(rm?.stock_quantity ?? 0);
      await Promise.all([
        supabase.from("raw_materials")
          .update({ stock_quantity: current - qty })
          .eq("id", item.raw_material_id),
        supabase.from("stock_movements").insert([{
          raw_material_id: item.raw_material_id,
          quantity: -qty,
          reason: "venta",
          notes: `Pedido entregado — ${item.description ?? ""}`,
        }]),
      ]);
    }
    revalidatePath("/admin/stock");
  }

  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/pedidos");
  return { success: true };
}

export async function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus,
  depositAmount?: number
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const update: Record<string, unknown> = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
  };
  if (depositAmount !== undefined) update.deposit_amount = depositAmount;

  const { error } = await supabase.from("orders").update(update).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/pedidos");
  return { success: true };
}

export async function updateDiscount(id: string, discount: number): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ discount, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/pedidos/${id}`);
  return { success: true };
}

// ── Item mutations ─────────────────────────────────────────────────────────────

export async function addOrderItem(
  orderId: string,
  rawMaterialId: string | null,
  description: string,
  quantity: number,
  unitPrice: number,
  customization: string
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("order_items").insert([{
    order_id: orderId,
    raw_material_id: rawMaterialId,
    description,
    quantity,
    unit_price: unitPrice,
    customization: customization || null,
  }]);
  if (error) return { error: error.message };

  await recalcTotals(supabase, orderId);
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { success: true };
}

export async function removeOrderItem(
  itemId: string,
  orderId: string
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("order_items").delete().eq("id", itemId);
  if (error) return { error: error.message };

  await recalcTotals(supabase, orderId);
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { success: true };
}

export async function deleteOrder(id: string): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/pedidos");
  return { success: true };
}

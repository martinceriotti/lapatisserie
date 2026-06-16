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

export type ProductVariant = {
  id: string;
  name: string;
  price_override: number | null;
  additional_cost: number | null;
  is_active: boolean;
};

export type ProductForOrder = {
  id: string;
  name: string;
  base_price: number | null;
  variants: ProductVariant[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  customization: string | null;
  notes: string | null;
  product: { id: string; name: string } | null;
  variant: { id: string; name: string } | null;
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
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, base_price,
      variants:product_variants(id, name, price_override, additional_cost, is_active)
    `)
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((p) => ({
    ...p,
    variants: ((p.variants as ProductVariant[]) ?? []).filter((v) => v.is_active),
  }));
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
        id, order_id, product_id, variant_id, description, quantity, unit_price,
        customization, notes,
        product:products(id, name),
        variant:product_variants(id, name)
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
  const { data: order } = await supabase
    .from("orders")
    .select("subtotal")
    .eq("id", id)
    .single();

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
  productId: string,
  variantId: string | null,
  description: string,
  quantity: number,
  unitPrice: number,
  customization: string
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("order_items").insert([{
    order_id: orderId,
    product_id: productId,
    variant_id: variantId || null,
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

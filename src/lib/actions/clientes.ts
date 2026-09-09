"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export type ActionResult = { success: true; id?: string } | { error: Record<string, string[]> | string };

export type ClienteOrder = {
  id: string;
  order_number: string;
  event_date: string | null;
  created_at: string;
  total: number | null;
  status: string;
};

export type Cliente = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  neighborhood: string | null;
  notes: string | null;
  created_at: string;
  orders: ClienteOrder[];
  order_count: number;
  last_order_date: string | null;
  total_spent: number;
};

function orderDate(o: ClienteOrder) {
  return o.event_date ?? o.created_at.slice(0, 10);
}

export async function getClientes(): Promise<Cliente[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, email, address, neighborhood, notes, created_at, orders(id, order_number, event_date, created_at, total, status)")
    .order("name");
  if (error) throw error;

  return (data ?? []).map((c) => {
    const orders = ([...((c.orders ?? []) as ClienteOrder[])]).sort((a, b) =>
      orderDate(b).localeCompare(orderDate(a))
    );
    const contables = orders.filter((o) => o.status !== "cancelado");
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      neighborhood: c.neighborhood,
      notes: c.notes,
      created_at: c.created_at,
      orders,
      order_count: orders.length,
      last_order_date: orders[0] ? orderDate(orders[0]) : null,
      total_spent: contables.reduce((s, o) => s + Number(o.total ?? 0), 0),
    };
  });
}

const schema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(200),
  phone: z.string().max(30).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().max(300).optional(),
  neighborhood: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

function parse(formData: FormData) {
  return schema.safeParse(Object.fromEntries(formData.entries()));
}

function toRow(d: z.infer<typeof schema>) {
  return {
    name: d.name,
    phone: d.phone || null,
    email: d.email || null,
    address: d.address || null,
    neighborhood: d.neighborhood || null,
    notes: d.notes || null,
  };
}

export async function createCliente(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .insert([toRow(parsed.data)])
    .select("id")
    .single();
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/pedidos");
  return { success: true, id: data.id };
}

export async function updateCliente(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase.from("customers").update(toRow(parsed.data)).eq("id", id);
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/pedidos");
  return { success: true };
}

export async function deleteCliente(id: string): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return { error: "No se puede eliminar: el cliente tiene pedidos asociados." };
    }
    return { error: error.message };
  }
  revalidatePath("/admin/clientes");
  return { success: true };
}

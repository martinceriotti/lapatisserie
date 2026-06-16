"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export type ActionResult =
  | { success: true }
  | { error: Record<string, string[]> | string };

// ── Suppliers ─────────────────────────────────────────────────────────────────

const supplierSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(200),
  phone: z.string().max(50).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
  is_active: z.coerce.boolean().default(true),
  default_iva_rate: z.coerce.number().min(0).max(1).default(0.21),
  parser_type: z.enum(["cepro", "drovandi", "lodiser", "pira"]).optional().or(z.literal("")),
});

export async function createSupplier(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = supplierSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase.from("suppliers").insert([{
    ...parsed.data,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
    notes: parsed.data.notes || null,
    parser_type: parsed.data.parser_type || null,
  }]);
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/proveedores");
  return { success: true };
}

export async function updateSupplier(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = supplierSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase.from("suppliers").update({
    ...parsed.data,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
    notes: parsed.data.notes || null,
    parser_type: parsed.data.parser_type || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/proveedores");
  return { success: true };
}

export async function deleteSupplier(id: string): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/proveedores");
  revalidatePath("/admin/materias-primas");
  return { success: true };
}

export async function getSuppliers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*, catalog_count:supplier_catalog(count)")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getSupplier(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// ── Supplier Catalog ──────────────────────────────────────────────────────────

const catalogSchema = z.object({
  supplier_sku: z.string().min(1, "Código requerido").max(100),
  product_name: z.string().min(1, "Nombre requerido").max(300),
  unit_description: z.string().max(100).optional(),
  price_net: z.coerce.number().nonnegative().optional(),
  price_final: z.coerce.number().positive("Precio requerido"),
  conversion_factor: z.coerce.number().positive().default(1),
  list_date: z.string().optional(),
  raw_material_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
});

export async function getSupplierCatalog(supplierId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("supplier_catalog")
    .select(`
      *,
      raw_material:raw_materials(id, name, unit, current_price)
    `)
    .eq("supplier_id", supplierId)
    .order("product_name");

  if (error) throw error;
  return data ?? [];
}

export async function createCatalogItem(
  supplierId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = catalogSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase.from("supplier_catalog").insert([{
    supplier_id: supplierId,
    supplier_sku: parsed.data.supplier_sku,
    product_name: parsed.data.product_name,
    unit_description: parsed.data.unit_description || null,
    price_net: parsed.data.price_net ?? null,
    price_final: parsed.data.price_final,
    conversion_factor: parsed.data.conversion_factor,
    list_date: parsed.data.list_date || new Date().toISOString().split("T")[0],
    raw_material_id: parsed.data.raw_material_id || null,
    notes: parsed.data.notes || null,
  }]);
  if (error) return { error: { _: [error.message] } };

  revalidatePath(`/admin/proveedores/${supplierId}`);
  revalidatePath("/admin/materias-primas");
  return { success: true };
}

export async function updateCatalogItem(
  id: string,
  supplierId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = catalogSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase.from("supplier_catalog").update({
    supplier_sku: parsed.data.supplier_sku,
    product_name: parsed.data.product_name,
    unit_description: parsed.data.unit_description || null,
    price_net: parsed.data.price_net ?? null,
    price_final: parsed.data.price_final,
    conversion_factor: parsed.data.conversion_factor,
    list_date: parsed.data.list_date || new Date().toISOString().split("T")[0],
    raw_material_id: parsed.data.raw_material_id || null,
    notes: parsed.data.notes || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: { _: [error.message] } };

  revalidatePath(`/admin/proveedores/${supplierId}`);
  revalidatePath("/admin/materias-primas");
  return { success: true };
}

export async function deleteCatalogItem(
  id: string,
  supplierId: string
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("supplier_catalog").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/proveedores/${supplierId}`);
  revalidatePath("/admin/materias-primas");
  return { success: true };
}

export async function linkCatalogItem(
  catalogItemId: string,
  supplierId: string,
  rawMaterialId: string | null
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("supplier_catalog")
    .update({ raw_material_id: rawMaterialId, updated_at: new Date().toISOString() })
    .eq("id", catalogItemId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/proveedores/${supplierId}`);
  revalidatePath("/admin/materias-primas");
  return { success: true };
}

export async function applySupplierPrice(
  rawMaterialId: string,
  supplierId: string,
  price: number,
  notes?: string
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("update_raw_material_price_with_supplier", {
    p_raw_material_id: rawMaterialId,
    p_new_price: price,
    p_supplier_id: supplierId,
    p_notes: notes ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/materias-primas");
  return { success: true };
}

export async function getRawMaterialsList() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("raw_materials")
    .select("id, name, unit, current_price")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

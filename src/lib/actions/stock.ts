"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { success: true } | { error: string };

export type MaterialType = "materia_prima" | "intermedio" | "producto_terminado";

export type StockItem = {
  id: string;
  name: string;
  unit: string;
  stock_quantity: number;
  current_price: number;
  material_type: MaterialType;
};

export type StockMovement = {
  id: string;
  raw_material_id: string;
  quantity: number;
  reason: "compra" | "ajuste" | "produccion" | "venta";
  notes: string | null;
  created_at: string;
};

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getStockLevels(): Promise<StockItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("raw_materials")
    .select("id, name, unit, stock_quantity, current_price, material_type")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getStockMovements(rawMaterialId: string): Promise<StockMovement[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("raw_material_id", rawMaterialId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function registerPurchase(
  rawMaterialId: string,
  quantity: number,
  notes: string,
  reason: "compra" | "produccion" = "compra"
): Promise<ActionResult> {
  if (quantity <= 0) return { error: "La cantidad debe ser mayor a 0" };

  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("raw_materials")
    .select("stock_quantity")
    .eq("id", rawMaterialId)
    .single();

  const newQty = Number(current?.stock_quantity ?? 0) + quantity;

  const [updateRes, movRes] = await Promise.all([
    supabase
      .from("raw_materials")
      .update({ stock_quantity: newQty })
      .eq("id", rawMaterialId),
    supabase.from("stock_movements").insert([{
      raw_material_id: rawMaterialId,
      quantity,
      reason,
      notes: notes || null,
    }]),
  ]);

  if (updateRes.error) return { error: updateRes.error.message };
  if (movRes.error) return { error: movRes.error.message };

  revalidatePath("/admin/stock");
  revalidatePath("/admin/produccion");
  return { success: true };
}

export async function adjustStock(
  rawMaterialId: string,
  newQuantity: number,
  notes: string
): Promise<ActionResult> {
  if (newQuantity < 0) return { error: "El stock no puede ser negativo" };

  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("raw_materials")
    .select("stock_quantity")
    .eq("id", rawMaterialId)
    .single();

  const delta = newQuantity - Number(current?.stock_quantity ?? 0);

  const [updateRes, movRes] = await Promise.all([
    supabase
      .from("raw_materials")
      .update({ stock_quantity: newQuantity })
      .eq("id", rawMaterialId),
    supabase.from("stock_movements").insert([{
      raw_material_id: rawMaterialId,
      quantity: delta,
      reason: "ajuste",
      notes: notes || null,
    }]),
  ]);

  if (updateRes.error) return { error: updateRes.error.message };
  if (movRes.error) return { error: movRes.error.message };

  revalidatePath("/admin/stock");
  revalidatePath("/admin/produccion");
  return { success: true };
}

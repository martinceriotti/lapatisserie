"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export type ActionResult =
  | { success: true }
  | { error: Record<string, string[]> | string };

export type AppSettings = {
  id: number;
  sale_price_factor: number;
  deposit_pct: number;
  updated_at: string;
};

export type OverheadItem = {
  id: string;
  name: string;
  type: "percentage" | "fixed_amount";
  value: number;
  is_active: boolean;
};

// ── App settings ──────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data as AppSettings;
}

const settingsSchema = z.object({
  sale_price_factor: z.coerce
    .number()
    .positive("El factor debe ser mayor a 0")
    .min(1, "El factor mínimo es 1")
    .max(20, "El factor máximo es 20"),
});

export async function updateSettings(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      sale_price_factor: parsed.data.sale_price_factor,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/recetas");
  revalidatePath("/admin/configuracion");
  return { success: true };
}

// ── Overhead settings ─────────────────────────────────────────────────────────

export async function getOverheadSettings(): Promise<OverheadItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("overhead_settings")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as OverheadItem[];
}

const overheadSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  type: z.enum(["percentage", "fixed_amount"]),
  value: z.coerce.number().positive("El valor debe ser mayor a 0"),
  is_active: z.coerce.boolean().default(true),
});

export async function createOverheadItem(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = overheadSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase.from("overhead_settings").insert([parsed.data]);
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/recetas");
  return { success: true };
}

export async function updateOverheadItem(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = overheadSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("overhead_settings")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/recetas");
  return { success: true };
}

export async function toggleOverheadItem(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("overhead_settings")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/recetas");
  return { success: true };
}

export async function deleteOverheadItem(id: string): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("overhead_settings").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/recetas");
  return { success: true };
}

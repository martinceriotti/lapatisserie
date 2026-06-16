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
  updated_at: string;
};

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

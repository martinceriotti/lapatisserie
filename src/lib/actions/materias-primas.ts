"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { UNITS, CATEGORIES } from "@/lib/constants/materias-primas";

const schema = z.object({
  name: z.string().min(1, "Nombre requerido").max(200),
  description: z.string().max(500).optional(),
  unit: z.enum(UNITS),
  category: z.enum(CATEGORIES),
  current_price: z.coerce.number().nonnegative("El precio debe ser 0 o mayor"),
  is_active: z.coerce.boolean().default(true),
});

export type MateriaPrimaFormData = z.infer<typeof schema>;

export type ActionResult =
  | { success: true }
  | { error: Record<string, string[]> | string };

export async function createMateriaPrima(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase.from("raw_materials").insert([parsed.data]);
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/materias-primas");
  return { success: true };
}

export async function updateMateriaPrima(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("raw_materials")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: { _: [error.message] } };

  revalidatePath("/admin/materias-primas");
  return { success: true };
}

export async function deleteMateriaPrima(id: string): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("raw_materials").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/materias-primas");
  return { success: true };
}

export async function getMateriasWithHistory() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("raw_materials")
    .select(`
      *,
      price_history:raw_material_price_history(
        id, price, effective_date, notes
      )
    `)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

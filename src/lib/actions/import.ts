"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseSupplierList } from "@/lib/parsers";
import type { ParsedItem, ParserType } from "@/lib/parsers";

type ImportPreviewResult =
  | { items: ParsedItem[]; warnings: string[]; rawText: string }
  | { error: string };

export async function extractPricelist(
  supplierId: string,
  formData: FormData
): Promise<ImportPreviewResult> {
  const file = formData.get("pdf") as File | null;
  if (!file || file.size === 0) return { error: "No se recibió ningún archivo." };
  if (!file.name.toLowerCase().endsWith(".pdf")) return { error: "El archivo debe ser un PDF." };

  const supabase = createAdminClient();
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("parser_type, default_iva_rate")
    .eq("id", supplierId)
    .single();

  if (!supplier) return { error: "Proveedor no encontrado." };
  if (!supplier.parser_type) return { error: "Este proveedor no tiene un formato de lista configurado. Editá el proveedor y elegí el formato." };

  try {
    const { extractText } = await import("unpdf");
    const uint8 = new Uint8Array(await file.arrayBuffer());
    const { text: pages } = await extractText(uint8, { mergePages: false });
    const text = pages.join("\n");

    const result = parseSupplierList(
      text,
      supplier.parser_type as ParserType,
      supplier.default_iva_rate ?? 0.21
    );

    return { items: result.items, warnings: result.warnings, rawText: result.rawText };
  } catch (e) {
    return { error: `Error al leer el PDF: ${e instanceof Error ? e.message : String(e)}` };
  }
}

type ImportResult = { imported: number } | { error: string };

export async function importParsedItems(
  supplierId: string,
  items: ParsedItem[],
  listDate: string
): Promise<ImportResult> {
  if (items.length === 0) return { imported: 0 };

  const supabase = createAdminClient();

  // Fetch existing catalog to preserve manual raw_material_id links
  const { data: existing } = await supabase
    .from("supplier_catalog")
    .select("supplier_sku, raw_material_id")
    .eq("supplier_id", supplierId);

  const linkMap = new Map<string, string | null>(
    (existing ?? []).map((e) => [e.supplier_sku, e.raw_material_id])
  );

  const rows = items.map((item) => ({
    supplier_id: supplierId,
    supplier_sku: item.supplier_sku,
    product_name: item.product_name,
    unit_description: item.unit_description ?? null,
    price_net: item.price_net,
    price_final: item.price_final,
    list_date: listDate,
    raw_material_id: linkMap.has(item.supplier_sku) ? linkMap.get(item.supplier_sku) : null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("supplier_catalog")
    .upsert(rows, { onConflict: "supplier_id,supplier_sku" });

  if (error) return { error: error.message };

  revalidatePath(`/admin/proveedores/${supplierId}`);
  revalidatePath("/admin/materias-primas");

  return { imported: rows.length };
}

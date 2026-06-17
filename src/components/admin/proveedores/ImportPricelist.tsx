"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { extractPricelist, importParsedItems } from "@/lib/actions/import";
import type { ParsedItem } from "@/lib/parsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, AlertTriangle, CheckCircle2, Loader2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const PARSER_LABELS: Record<string, string> = {
  cepro: "CEPRO",
  drovandi: "Drovandi",
  lodiser: "Lodiser",
};

// IVA note per parser: explains how prices were computed
const IVA_NOTES: Record<string, (rate: number) => string> = {
  cepro: () => "CEPRO incluye ambos precios (neto y final) en el PDF.",
  drovandi: (r) => `Drovandi: precio final incluye IVA ${(r * 100).toFixed(1)}%. Precio neto calculado.`,
  lodiser: (r) => `Lodiser: precio sin IVA. Precio final calculado sumando ${(r * 100).toFixed(1)}% IVA.`,
};

type Step = "upload" | "preview" | "done";

export function ImportPricelist({
  supplierId,
  supplierName,
  parserType,
  ivaRate,
  existingSkus,
}: {
  supplierId: string;
  supplierName: string;
  parserType: string | null;
  ivaRate: number;
  existingSkus: Set<string>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [rawText, setRawText] = useState<string>("");
  const [showRaw, setShowRaw] = useState(false);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [listDate, setListDate] = useState(new Date().toISOString().split("T")[0]);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("upload");
    setError(null);
    setWarnings([]);
    setRawText("");
    setShowRaw(false);
    setItems([]);
    setSelected(new Set());
    setListDate(new Date().toISOString().split("T")[0]);
    setImportedCount(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleOpen(o: boolean) {
    setOpen(o);
    if (!o) reset();
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(items.map((i) => i.supplier_sku)) : new Set());
  }

  function toggleItem(sku: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(sku) : next.delete(sku);
      return next;
    });
  }

  function updateItemPrice(sku: string, field: "price_net" | "price_final", raw: string) {
    const value = parseFloat(raw) || 0;
    setItems((prev) =>
      prev.map((item) =>
        item.supplier_sku === sku ? { ...item, [field]: Math.round(value * 100) / 100 } : item
      )
    );
  }

  function handleExtract() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Seleccioná un archivo PDF."); return; }

    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("pdf", file);
      const result = await extractPricelist(supplierId, fd);

      if ("error" in result) { setError(result.error); return; }

      setItems(result.items);
      setWarnings(result.warnings);
      setRawText(result.rawText);
      setSelected(new Set(result.items.map((i) => i.supplier_sku)));
      setStep("preview");
    });
  }

  function handleImport() {
    const toImport = items.filter((i) => selected.has(i.supplier_sku));
    if (toImport.length === 0) { setError("Seleccioná al menos un producto."); return; }

    setError(null);
    startTransition(async () => {
      const result = await importParsedItems(supplierId, toImport, listDate);
      if ("error" in result) { setError(result.error); return; }
      setImportedCount(result.imported);
      setStep("done");
    });
  }

  const newCount = items.filter((i) => !existingSkus.has(i.supplier_sku)).length;
  const updateCount = items.length - newCount;
  const ivaNote = parserType ? IVA_NOTES[parserType]?.(ivaRate) : null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 shrink-0"
        disabled={!parserType}
        title={!parserType ? "Configurá el formato de lista en los datos del proveedor" : undefined}
        onClick={() => setOpen(true)}
      >
        <Upload className="w-3.5 h-3.5" />
        Importar lista
        {parserType && (
          <span className="text-muted-foreground text-xs">({PARSER_LABELS[parserType] ?? parserType})</span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={handleOpen}>
        <SheetContent side="right" className="w-full sm:max-w-3xl flex flex-col p-0">
          <SheetHeader className="px-6 py-5 border-b border-border">
            <SheetTitle>Importar lista de precios — {supplierName}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* ── STEP 1: Upload ── */}
            {step === "upload" && (
              <div className="space-y-5 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="import-pdf">Archivo PDF</Label>
                  <Input
                    id="import-pdf"
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Máx. 5 MB. El PDF no se guarda; solo se extraen los precios.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="import-date">Fecha de la lista</Label>
                  <Input
                    id="import-date"
                    type="date"
                    value={listDate}
                    onChange={(e) => setListDate(e.target.value)}
                    className="w-48"
                  />
                </div>

                {ivaNote && (
                  <p className="text-xs text-muted-foreground bg-accent/50 rounded-lg px-3 py-2.5">
                    {ivaNote}
                  </p>
                )}

                {error && (
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleExtract}
                  disabled={isPending}
                  className="gradient-brand text-white border-0"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extrayendo precios…</>
                  ) : (
                    "Extraer precios"
                  )}
                </Button>
              </div>
            )}

            {/* ── STEP 2: Preview ── */}
            {step === "preview" && (
              <div className="space-y-4">

                {/* Summary */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium">
                    {items.length} productos encontrados
                  </span>
                  {newCount > 0 && (
                    <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-xs">
                      {newCount} nuevos
                    </Badge>
                  )}
                  {updateCount > 0 && (
                    <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 text-xs">
                      {updateCount} actualizaciones
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground ml-auto">
                    {selected.size} seleccionados
                  </span>
                </div>

                {ivaNote && (
                  <p className="text-xs text-muted-foreground bg-accent/50 rounded-lg px-3 py-2">
                    {ivaNote}
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Pencil className="w-3 h-3" />
                  Podés editar los precios directamente en la tabla antes de importar.
                </div>

                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    {w}
                  </div>
                ))}

                {error && (
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Preview table */}
                <div className="border border-border rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-accent/50 hover:bg-accent/50">
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            checked={selected.size === items.length && items.length > 0}
                            onChange={(e) => toggleAll(e.target.checked)}
                            className="w-4 h-4 rounded accent-primary cursor-pointer"
                          />
                        </TableHead>
                        <TableHead className="font-medium w-28">SKU</TableHead>
                        <TableHead className="font-medium">Producto</TableHead>
                        <TableHead className="font-medium">Presentación</TableHead>
                        <TableHead className="font-medium text-right w-36">Precio neto</TableHead>
                        <TableHead className="font-medium text-right w-36">Precio final</TableHead>
                        <TableHead className="font-medium w-24">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const isNew = !existingSkus.has(item.supplier_sku);
                        const checked = selected.has(item.supplier_sku);
                        return (
                          <TableRow
                            key={item.supplier_sku}
                            className={cn(!checked && "opacity-40")}
                          >
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => toggleItem(item.supplier_sku, e.target.checked)}
                                className="w-4 h-4 rounded accent-primary cursor-pointer"
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {item.supplier_sku}
                            </TableCell>
                            <TableCell className="text-sm font-medium max-w-[160px] truncate">
                              {item.product_name}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.unit_description ?? <span className="opacity-40">—</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              <input
                                type="number"
                                value={item.price_net}
                                onChange={(e) => updateItemPrice(item.supplier_sku, "price_net", e.target.value)}
                                className="w-full text-right font-mono text-sm bg-transparent border border-transparent rounded px-1 hover:border-border focus:border-primary focus:outline-none transition-colors"
                                step="0.01"
                                min="0"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <input
                                type="number"
                                value={item.price_final}
                                onChange={(e) => updateItemPrice(item.supplier_sku, "price_final", e.target.value)}
                                className="w-full text-right font-mono text-sm font-semibold bg-transparent border border-transparent rounded px-1 hover:border-border focus:border-primary focus:outline-none transition-colors"
                                step="0.01"
                                min="0"
                              />
                            </TableCell>
                            <TableCell>
                              {isNew ? (
                                <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-xs">
                                  Nuevo
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 text-xs">
                                  Actualizar
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Raw text debug toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowRaw((s) => !s)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    Ver texto crudo del PDF
                  </button>
                  {showRaw && (
                    <pre className="mt-2 text-xs bg-muted rounded-lg p-3 overflow-auto max-h-60 whitespace-pre-wrap break-all">
                      {rawText}
                    </pre>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep("upload")}>
                    Volver
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={isPending || selected.size === 0}
                    className="gradient-brand text-white border-0"
                  >
                    {isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importando…</>
                    ) : (
                      `Importar ${selected.size} producto${selected.size !== 1 ? "s" : ""}`
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Done ── */}
            {step === "done" && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">¡Importación completada!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {importedCount} productos actualizados en el catálogo.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Los precios nuevos quedan sin vincular hasta que los asocies a una materia prima.
                  </p>
                </div>
                <Button
                  className="gradient-brand text-white border-0 mt-2"
                  onClick={() => { handleOpen(false); router.refresh(); }}
                >
                  Ver catálogo actualizado
                </Button>
              </div>
            )}

          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

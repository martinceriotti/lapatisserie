"use client";

import { useActionState } from "react";
import { updateSettings, type ActionResult } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";

export function SettingsForm({ currentFactor }: { currentFactor: number }) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    updateSettings,
    null
  );

  const errors =
    state && "error" in state
      ? typeof state.error === "string"
        ? { _: [state.error] }
        : state.error
      : null;

  return (
    <form action={action} className="space-y-6 max-w-sm">
      <div className="space-y-1.5">
        <Label htmlFor="sale_price_factor">Factor de precio de venta</Label>
        <p className="text-xs text-muted-foreground">
          El precio sugerido de venta se calcula como: <strong>costo por unidad × factor</strong>.
          Con factor 3 y un costo de $100, el precio sugerido es $300.
        </p>
        <Input
          id="sale_price_factor"
          name="sale_price_factor"
          type="number"
          step="0.1"
          min="1"
          max="20"
          defaultValue={currentFactor}
          className="max-w-[120px]"
        />
        {errors?.sale_price_factor && (
          <p className="text-xs text-destructive">{errors.sale_price_factor[0]}</p>
        )}
        {errors?._ && (
          <p className="text-xs text-destructive">{errors._[0]}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="gradient-brand text-white border-0 hover:opacity-90"
        >
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Guardar
        </Button>
        {state && "success" in state && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Guardado
          </span>
        )}
      </div>
    </form>
  );
}

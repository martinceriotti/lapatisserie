-- Factor de conversión: cuántas unidades de materia prima trae una presentación del proveedor.
-- Ej: caja de 10 kg con MP por kg → factor = 10
-- Precio efectivo por unidad de MP = price_final / conversion_factor
ALTER TABLE supplier_catalog
  ADD COLUMN IF NOT EXISTS conversion_factor NUMERIC(10, 4) NOT NULL DEFAULT 1
    CHECK (conversion_factor > 0);

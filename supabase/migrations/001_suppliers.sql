-- ============================================================
-- Migration 001: Sistema de Proveedores
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Tabla de proveedores
CREATE TABLE IF NOT EXISTS suppliers (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  phone      text,
  email      text,
  address    text,
  notes      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Catálogo de productos por proveedor
--    (sus códigos, sus nombres, sus precios)
CREATE TABLE IF NOT EXISTS supplier_catalog (
  id               uuid primary key default uuid_generate_v4(),
  supplier_id      uuid not null references suppliers(id) on delete cascade,
  supplier_sku     text not null,           -- código del proveedor (ej: "50203")
  product_name     text not null,           -- nombre según el proveedor
  unit_description text,                    -- ej: "x 25 Kg"
  price_net        numeric(12, 2),
  price_final      numeric(12, 2) not null,
  list_date        date not null default current_date,
  raw_material_id  uuid references raw_materials(id) on delete set null,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (supplier_id, supplier_sku)
);

-- 3. Agregar supplier_id al historial de precios
ALTER TABLE raw_material_price_history
  ADD COLUMN IF NOT EXISTS supplier_id uuid references suppliers(id) on delete set null;

-- 4. Eliminar campo supplier simple de raw_materials
--    (reemplazado por la relación con supplier_catalog)
ALTER TABLE raw_materials DROP COLUMN IF EXISTS supplier;

-- 5. Actualizar trigger para soportar rastreo de proveedor
--    Cuando se llama desde update_raw_material_price_with_supplier(),
--    el flag 'app.skip_price_trigger' evita duplicar el registro.
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF old.current_price <> new.current_price THEN
    IF current_setting('app.skip_price_trigger', true) = 'true' THEN
      PERFORM set_config('app.skip_price_trigger', 'false', true);
    ELSE
      INSERT INTO raw_material_price_history (raw_material_id, price, effective_date)
      VALUES (new.id, new.current_price, current_date);
    END IF;
  END IF;
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para actualizar precio con proveedor
--    Evita el trigger genérico e inserta en el historial con supplier_id
CREATE OR REPLACE FUNCTION update_raw_material_price_with_supplier(
  p_raw_material_id uuid,
  p_new_price       numeric,
  p_supplier_id     uuid,
  p_notes           text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.skip_price_trigger', 'true', true);

  UPDATE raw_materials
  SET current_price = p_new_price
  WHERE id = p_raw_material_id;

  IF FOUND THEN
    INSERT INTO raw_material_price_history
      (raw_material_id, price, effective_date, supplier_id, notes)
    VALUES
      (p_raw_material_id, p_new_price, current_date, p_supplier_id, p_notes);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS
ALTER TABLE suppliers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_catalog ENABLE ROW LEVEL SECURITY;

-- 8. Índices
CREATE INDEX IF NOT EXISTS idx_supplier_catalog_supplier     ON supplier_catalog (supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_catalog_raw_material ON supplier_catalog (raw_material_id);
CREATE INDEX IF NOT EXISTS idx_price_history_supplier        ON raw_material_price_history (supplier_id);

-- ============================================================
-- 002: Campos para importación automática de listas de precios
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS default_iva_rate NUMERIC(5,4) NOT NULL DEFAULT 0.21,
  ADD COLUMN IF NOT EXISTS parser_type TEXT;

ALTER TABLE suppliers
  ADD CONSTRAINT suppliers_parser_type_check
  CHECK (parser_type IN ('cepro', 'drovandi', 'lodiser') OR parser_type IS NULL);

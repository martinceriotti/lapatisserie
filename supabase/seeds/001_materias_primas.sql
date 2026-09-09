-- ============================================================
-- Seed: Materias primas — La Patisserie
-- Generado por scripts/migracion/gen_materias_primas.py
-- Fuente: scripts/migracion/materias_primas.csv (53 insumos)
-- ============================================================

begin;

insert into raw_materials (name, unit, category, current_price, material_type, stock_quantity, is_active) values
  ('Manteca', 'kg', 'dairy', 11000, 'materia_prima', 0, true),
  ('Harina 0000', 'kg', 'flour', 1100, 'materia_prima', 0, true),
  ('Azúcar Impalpable', 'kg', 'sugar', 1500, 'materia_prima', 0, true),
  ('Cacao', 'kg', 'chocolate', 25000, 'materia_prima', 0, true),
  ('Huevo', 'unidad', 'eggs', 210, 'materia_prima', 0, true),
  ('Azúcar Común', 'kg', 'sugar', 1400, 'materia_prima', 0, true),
  ('Maizena', 'kg', 'flour', 2100, 'materia_prima', 0, true),
  ('Chocolate Taza', 'kg', 'chocolate', 26000, 'materia_prima', 0, true),
  ('Nueces', 'kg', 'nuts', 22000, 'materia_prima', 0, true),
  ('Dulce de Leche', 'kg', 'dairy', 5000, 'materia_prima', 0, true),
  ('Crema', 'l', 'dairy', 10000, 'materia_prima', 0, true),
  ('Harina Leudante', 'kg', 'flour', 2100, 'materia_prima', 0, true),
  ('Limón', 'unidad', 'fruit', 500, 'materia_prima', 0, true),
  ('Bicarbonato', 'kg', 'powders', 900, 'materia_prima', 0, true),
  ('Polvo de Hornear', 'kg', 'powders', 4000, 'materia_prima', 0, true),
  ('Leche', 'l', 'dairy', 2500, 'materia_prima', 0, true),
  ('Coñac', 'l', 'other', 26667, 'materia_prima', 0, true),
  ('Naranja', 'unidad', 'fruit', 500, 'materia_prima', 0, true),
  ('Azúcar Negro', 'kg', 'sugar', 2300, 'materia_prima', 0, true),
  ('Chocolate Alfajores', 'kg', 'chocolate', 10000, 'materia_prima', 0, true),
  ('Ciruelas', 'kg', 'fruit', 6807, 'materia_prima', 0, true),
  ('Pasas de Uva', 'kg', 'fruit', 4821, 'materia_prima', 0, true),
  ('Yogur', 'kg', 'dairy', 21053, 'materia_prima', 0, true),
  ('Chips de Chocolate', 'kg', 'chocolate', 8000, 'materia_prima', 0, true),
  ('Leche Condensada', 'unidad', 'dairy', 4500, 'materia_prima', 0, true),
  ('Gelatina sin Sabor', 'sobre', 'powders', 2000, 'materia_prima', 0, true),
  ('Frutos Rojos', 'kg', 'fruit', 20000, 'materia_prima', 0, true),
  ('Vasitos', 'unidad', 'packaging', 3, 'materia_prima', 0, true),
  ('Pasta de Forrar', 'kg', 'other', 6000, 'materia_prima', 0, true),
  ('Bandeja', 'unidad', 'packaging', 20, 'materia_prima', 0, true),
  ('Goma Eva', 'unidad', 'packaging', 15, 'materia_prima', 0, true),
  ('Cinta', 'unidad', 'packaging', 15, 'materia_prima', 0, true),
  ('Pirotines', 'unidad', 'packaging', 1.25, 'materia_prima', 0, true),
  ('Peras', 'unidad', 'fruit', 600, 'materia_prima', 0, true),
  ('Palitos (cakepop)', 'unidad', 'packaging', 5, 'materia_prima', 0, true),
  ('Queso Crema', 'kg', 'dairy', 9000, 'materia_prima', 0, true),
  ('Pasta de Goma', 'kg', 'other', 7000, 'materia_prima', 0, true),
  ('Mix Europeo', 'kg', 'fruit', 23000, 'materia_prima', 0, true),
  ('Aceite', 'l', 'other', 1200, 'materia_prima', 0, true),
  ('Rocklets', 'kg', 'chocolate', 12500, 'materia_prima', 0, true),
  ('Levadura', 'sobre', 'powders', 25, 'materia_prima', 0, true),
  ('Coco Rayado', 'kg', 'other', 12000, 'materia_prima', 0, true),
  ('Dulce de Membrillo', 'kg', 'fruit', 6000, 'materia_prima', 0, true),
  ('Oreo (tripack x36)', 'unidad', 'other', 6322, 'materia_prima', 0, true),
  ('Nutella', 'kg', 'chocolate', 33333, 'materia_prima', 0, true),
  ('Esencia de Vainilla', 'l', 'other', 26520, 'materia_prima', 0, true),
  ('Manzana', 'unidad', 'fruit', 600, 'materia_prima', 0, true),
  ('Arándanos', 'kg', 'fruit', 3325, 'materia_prima', 0, true),
  ('Almendras', 'kg', 'nuts', 9900, 'materia_prima', 0, true),
  ('Miel', 'kg', 'other', 8000, 'materia_prima', 0, true),
  ('Maní', 'kg', 'nuts', 2600, 'materia_prima', 0, true),
  ('Pasta de Maní', 'kg', 'nuts', 6300, 'materia_prima', 0, true),
  ('Baño de Moldeo', 'kg', 'chocolate', 11667, 'materia_prima', 0, true);

commit;

-- Verificación
select category, count(*), min(current_price), max(current_price)
from raw_materials group by category order by category;

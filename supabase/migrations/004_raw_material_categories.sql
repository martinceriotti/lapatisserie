-- Agregar categorías: huevos, frutos secos y polvos
-- Nota: "fruit" (Frutas) ya existía en el ENUM
ALTER TYPE raw_material_category ADD VALUE IF NOT EXISTS 'eggs';
ALTER TYPE raw_material_category ADD VALUE IF NOT EXISTS 'nuts';
ALTER TYPE raw_material_category ADD VALUE IF NOT EXISTS 'powders';

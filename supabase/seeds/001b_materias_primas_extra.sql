-- ============================================================
-- Seed: Materias primas extra — descubiertas al mapear recetas
-- Ejecutar DESPUÉS de 001_materias_primas.sql y ANTES de 002_recetas.sql
-- ============================================================
-- Insumos que aparecen en las recetas pero no estaban en la hoja
-- "Valores y Totales" del Excel.

insert into raw_materials (name, unit, category, current_price, material_type, stock_quantity, is_active)
select 'Banana', 'unidad', 'fruit', 500, 'materia_prima', 0, true
where not exists (select 1 from raw_materials where name = 'Banana');

select name, unit, category, current_price from raw_materials where name = 'Banana';

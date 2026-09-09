-- ============================================================
-- Seed: Recetas — La Patisserie
-- Generado por scripts/migracion/gen_recetas.py
-- Fuente: docs/migracion/recetas_map.csv (36 recetas)
-- Migración plana: cada receta lista sus ingredientes crudos.
-- ============================================================

begin;

-- Alfajores de Chocolate (3cm)  (8 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Alfajores de Chocolate (3cm)', 'alfajores-de-chocolate-3cm', (select id from recipe_categories where slug = 'alfajores'), 80, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 150, 'g'),
    ('Harina 0000', 200, 'g'),
    ('Cacao', 50, 'g'),
    ('Huevo', 3, 'unidad'),
    ('Maizena', 50, 'g'),
    ('Dulce de Leche', 1000, 'g'),
    ('Azúcar Negro', 100, 'g'),
    ('Chocolate Alfajores', 500, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Alfajores de Maicena (3cm)  (9 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Alfajores de Maicena (3cm)', 'alfajores-de-maicena-3cm', (select id from recipe_categories where slug = 'alfajores'), 80, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 200, 'g'),
    ('Harina 0000', 200, 'g'),
    ('Huevo', 2, 'unidad'),
    ('Azúcar Común', 150, 'g'),
    ('Maizena', 300, 'g'),
    ('Dulce de Leche', 1000, 'g'),
    ('Limón', 1, 'unidad'),
    ('Polvo de Hornear', 10, 'g'),
    ('Coñac', 20, 'ml')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Alfajores Mini Rogel  (5 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Alfajores Mini Rogel', 'alfajores-mini-rogel', (select id from recipe_categories where slug = 'alfajores'), 80, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 60, 'g'),
    ('Harina 0000', 300, 'g'),
    ('Huevo', 6, 'unidad'),
    ('Azúcar Común', 300, 'g'),
    ('Dulce de Leche', 1000, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Alfajores de Nuez  (6 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Alfajores de Nuez', 'alfajores-de-nuez', (select id from recipe_categories where slug = 'alfajores'), 60, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 200, 'g'),
    ('Harina 0000', 250, 'g'),
    ('Huevo', 1, 'unidad'),
    ('Nueces', 200, 'g'),
    ('Dulce de Leche', 1000, 'g'),
    ('Azúcar Negro', 200, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Alfajores de Chocolate con Nutella (4cm)  (8 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Alfajores de Chocolate con Nutella (4cm)', 'alfajores-de-chocolate-con-nutella-4cm', (select id from recipe_categories where slug = 'alfajores'), 40, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 150, 'g'),
    ('Harina 0000', 200, 'g'),
    ('Cacao', 50, 'g'),
    ('Huevo', 3, 'unidad'),
    ('Maizena', 50, 'g'),
    ('Azúcar Negro', 100, 'g'),
    ('Chocolate Alfajores', 400, 'g'),
    ('Nutella', 440, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Alfajores de Maicena (4cm)  (10 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Alfajores de Maicena (4cm)', 'alfajores-de-maicena-4cm', (select id from recipe_categories where slug = 'alfajores'), 70, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 200, 'g'),
    ('Coco Rayado', 125, 'g'),
    ('Harina 0000', 200, 'g'),
    ('Huevo', 2, 'unidad'),
    ('Azúcar Común', 150, 'g'),
    ('Maizena', 300, 'g'),
    ('Dulce de Leche', 1300, 'g'),
    ('Limón', 1, 'unidad'),
    ('Polvo de Hornear', 10, 'g'),
    ('Coñac', 20, 'ml')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Alfajores de Chocolate (4cm)  (8 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Alfajores de Chocolate (4cm)', 'alfajores-de-chocolate-4cm', (select id from recipe_categories where slug = 'alfajores'), 40, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 150, 'g'),
    ('Harina 0000', 200, 'g'),
    ('Cacao', 50, 'g'),
    ('Huevo', 3, 'unidad'),
    ('Maizena', 50, 'g'),
    ('Dulce de Leche', 800, 'g'),
    ('Azúcar Negro', 100, 'g'),
    ('Chocolate Alfajores', 400, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Brownies (plancha)  (6 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Brownies (plancha)', 'brownies-plancha', (select id from recipe_categories where slug = 'brownies'), 60, 'porciones', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 300, 'g'),
    ('Harina 0000', 200, 'g'),
    ('Huevo', 6, 'unidad'),
    ('Azúcar Común', 300, 'g'),
    ('Chocolate Taza', 360, 'g'),
    ('Azúcar Negro', 360, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Budín de Banana  (8 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Budín de Banana', 'budin-de-banana', (select id from recipe_categories where slug = 'budines'), 2, 'porciones', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Aceite', 100, 'ml'),
    ('Huevo', 2, 'unidad'),
    ('Azúcar Común', 200, 'g'),
    ('Harina Leudante', 300, 'g'),
    ('Leche', 100, 'ml'),
    ('Banana', 2, 'unidad'),
    ('Chocolate Alfajores', 100, 'g'),
    ('Chips de Chocolate', 100, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Budín de Manzanas  (8 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Budín de Manzanas', 'budin-de-manzanas', (select id from recipe_categories where slug = 'budines'), 2, 'porciones', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Aceite', 100, 'ml'),
    ('Azúcar Impalpable', 200, 'g'),
    ('Huevo', 2, 'unidad'),
    ('Azúcar Común', 200, 'g'),
    ('Harina Leudante', 300, 'g'),
    ('Limón', 1, 'unidad'),
    ('Leche', 100, 'ml'),
    ('Naranja', 1, 'unidad')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Budín de Arándanos  (6 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Budín de Arándanos', 'budin-de-arandanos', (select id from recipe_categories where slug = 'budines'), 1, 'porciones', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 120, 'g'),
    ('Azúcar Impalpable', 270, 'g'),
    ('Huevo', 2, 'unidad'),
    ('Harina Leudante', 130, 'g'),
    ('Limón', 1, 'unidad'),
    ('Arándanos', 100, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Cakepops  (8 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Cakepops', 'cakepops', (select id from recipe_categories where slug = 'cakepops'), 36, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 125, 'g'),
    ('Harina 0000', 125, 'g'),
    ('Huevo', 2.5, 'unidad'),
    ('Azúcar Común', 125, 'g'),
    ('Dulce de Leche', 220, 'g'),
    ('Polvo de Hornear', 5, 'g'),
    ('Chocolate Alfajores', 300, 'g'),
    ('Palitos (cakepop)', 36, 'unidad')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Cookies Choco-chips  (7 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Cookies Choco-chips', 'cookies-choco-chips', (select id from recipe_categories where slug = 'cookies'), 66, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 200, 'g'),
    ('Harina 0000', 400, 'g'),
    ('Cacao', 50, 'g'),
    ('Huevo', 2, 'unidad'),
    ('Polvo de Hornear', 15, 'g'),
    ('Azúcar Negro', 400, 'g'),
    ('Chips de Chocolate', 150, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Cookies de Pasas y Nueces  (7 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Cookies de Pasas y Nueces', 'cookies-de-pasas-y-nueces', (select id from recipe_categories where slug = 'cookies'), 100, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 200, 'g'),
    ('Harina 0000', 450, 'g'),
    ('Huevo', 2, 'unidad'),
    ('Azúcar Común', 400, 'g'),
    ('Nueces', 150, 'g'),
    ('Polvo de Hornear', 15, 'g'),
    ('Pasas de Uva', 150, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Cookies Choco Chips Rocklets  (7 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Cookies Choco Chips Rocklets', 'cookies-choco-chips-rocklets', (select id from recipe_categories where slug = 'cookies'), 80, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 200, 'g'),
    ('Harina 0000', 400, 'g'),
    ('Huevo', 2, 'unidad'),
    ('Azúcar Común', 400, 'g'),
    ('Polvo de Hornear', 15, 'g'),
    ('Chips de Chocolate', 150, 'g'),
    ('Rocklets', 200, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Cookies Chip (taller)  (7 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Cookies Chip (taller)', 'cookies-chip-taller', (select id from recipe_categories where slug = 'cookies'), 24, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 115, 'g'),
    ('Harina 0000', 185, 'g'),
    ('Huevo', 1, 'unidad'),
    ('Azúcar Común', 100, 'g'),
    ('Maizena', 30, 'g'),
    ('Azúcar Negro', 100, 'g'),
    ('Chips de Chocolate', 150, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Brookies (doble choco)  (8 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Brookies (doble choco)', 'brookies-doble-choco', (select id from recipe_categories where slug = 'cookies'), 34, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 110, 'g'),
    ('Harina 0000', 155, 'g'),
    ('Cacao', 50, 'g'),
    ('Huevo', 2, 'unidad'),
    ('Chocolate Taza', 225, 'g'),
    ('Polvo de Hornear', 10, 'g'),
    ('Azúcar Negro', 225, 'g'),
    ('Chips de Chocolate', 150, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Pepas  (7 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Pepas', 'pepas', (select id from recipe_categories where slug = 'cookies'), 48, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 125, 'g'),
    ('Harina 0000', 300, 'g'),
    ('Huevo', 2, 'unidad'),
    ('Azúcar Común', 125, 'g'),
    ('Limón', 1, 'unidad'),
    ('Polvo de Hornear', 8, 'g'),
    ('Dulce de Membrillo', 300, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Masitas de Manteca  (4 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Masitas de Manteca', 'masitas-de-manteca', (select id from recipe_categories where slug = 'cookies'), 40, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 250, 'g'),
    ('Harina 0000', 500, 'g'),
    ('Huevo', 1, 'unidad'),
    ('Azúcar Común', 220, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Donas de Chocolate  (8 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Donas de Chocolate', 'donas-de-chocolate', (select id from recipe_categories where slug = 'donas'), 36, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 120, 'g'),
    ('Cacao', 40, 'g'),
    ('Huevo', 3, 'unidad'),
    ('Crema', 50, 'ml'),
    ('Harina Leudante', 160, 'g'),
    ('Leche', 80, 'ml'),
    ('Azúcar Negro', 170, 'g'),
    ('Chocolate Alfajores', 150, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Donas de Vainilla  (6 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Donas de Vainilla', 'donas-de-vainilla', (select id from recipe_categories where slug = 'donas'), 36, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Huevo', 3, 'unidad'),
    ('Azúcar Común', 170, 'g'),
    ('Harina Leudante', 220, 'g'),
    ('Leche', 100, 'ml'),
    ('Chocolate Alfajores', 360, 'g'),
    ('Aceite', 100, 'ml')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Espumita de Limón (plancha 20x30)  (8 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Espumita de Limón (plancha 20x30)', 'espumita-de-limon-plancha-20x30', (select id from recipe_categories where slug = 'postres'), 30, 'porciones', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 130, 'g'),
    ('Harina 0000', 175, 'g'),
    ('Azúcar Impalpable', 300, 'g'),
    ('Huevo', 3, 'unidad'),
    ('Azúcar Común', 225, 'g'),
    ('Limón', 2, 'unidad'),
    ('Polvo de Hornear', 7, 'g'),
    ('Queso Crema', 90, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Pastafrola de Dulce de Leche  (8 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Pastafrola de Dulce de Leche', 'pastafrola-de-dulce-de-leche', (select id from recipe_categories where slug = 'mini-pasteleria'), 2, 'porciones', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 150, 'g'),
    ('Harina 0000', 400, 'g'),
    ('Azúcar Impalpable', 100, 'g'),
    ('Huevo', 3, 'unidad'),
    ('Nueces', 100, 'g'),
    ('Dulce de Leche', 1000, 'g'),
    ('Limón', 1, 'unidad'),
    ('Polvo de Hornear', 10, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Pastafrola de Membrillo  (7 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Pastafrola de Membrillo', 'pastafrola-de-membrillo', (select id from recipe_categories where slug = 'mini-pasteleria'), 60, 'porciones', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 250, 'g'),
    ('Harina 0000', 500, 'g'),
    ('Azúcar Impalpable', 150, 'g'),
    ('Huevo', 2, 'unidad'),
    ('Limón', 1, 'unidad'),
    ('Polvo de Hornear', 10, 'g'),
    ('Dulce de Membrillo', 1200, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Mini Frola de Membrillo  (7 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Mini Frola de Membrillo', 'mini-frola-de-membrillo', (select id from recipe_categories where slug = 'mini-pasteleria'), 15, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 250, 'g'),
    ('Harina 0000', 500, 'g'),
    ('Azúcar Impalpable', 150, 'g'),
    ('Huevo', 2, 'unidad'),
    ('Limón', 1, 'unidad'),
    ('Polvo de Hornear', 10, 'g'),
    ('Dulce de Membrillo', 1200, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Mini Frola de Dulce de Leche  (7 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Mini Frola de Dulce de Leche', 'mini-frola-de-dulce-de-leche', (select id from recipe_categories where slug = 'mini-pasteleria'), 15, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 250, 'g'),
    ('Harina 0000', 500, 'g'),
    ('Azúcar Impalpable', 150, 'g'),
    ('Huevo', 2, 'unidad'),
    ('Dulce de Leche', 1200, 'g'),
    ('Limón', 1, 'unidad'),
    ('Polvo de Hornear', 15, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Mini Frola de DDL y Coco  (9 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Mini Frola de DDL y Coco', 'mini-frola-de-ddl-y-coco', (select id from recipe_categories where slug = 'mini-pasteleria'), 15, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 310, 'g'),
    ('Harina 0000', 500, 'g'),
    ('Azúcar Impalpable', 150, 'g'),
    ('Huevo', 6, 'unidad'),
    ('Azúcar Común', 150, 'g'),
    ('Dulce de Leche', 1200, 'g'),
    ('Limón', 1, 'unidad'),
    ('Polvo de Hornear', 15, 'g'),
    ('Coco Rayado', 300, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Mini Frola de Manzana  (8 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Mini Frola de Manzana', 'mini-frola-de-manzana', (select id from recipe_categories where slug = 'mini-pasteleria'), 15, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 350, 'g'),
    ('Harina 0000', 500, 'g'),
    ('Azúcar Impalpable', 150, 'g'),
    ('Huevo', 2, 'unidad'),
    ('Azúcar Común', 160, 'g'),
    ('Limón', 1, 'unidad'),
    ('Polvo de Hornear', 15, 'g'),
    ('Manzana', 10, 'unidad')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Tarta de Coco (placa 20x30)  (9 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Tarta de Coco (placa 20x30)', 'tarta-de-coco-placa-20x30', (select id from recipe_categories where slug = 'mini-pasteleria'), 30, 'porciones', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 155, 'g'),
    ('Harina 0000', 250, 'g'),
    ('Azúcar Impalpable', 150, 'g'),
    ('Huevo', 3, 'unidad'),
    ('Azúcar Común', 75, 'g'),
    ('Dulce de Leche', 700, 'g'),
    ('Limón', 1, 'unidad'),
    ('Polvo de Hornear', 7, 'g'),
    ('Coco Rayado', 150, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Cascaritas (100g)  (3 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Cascaritas (100g)', 'cascaritas-100g', (select id from recipe_categories where slug = 'bombones'), 1, 'porciones', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Azúcar Común', 1000, 'g'),
    ('Naranja', 5, 'unidad'),
    ('Chocolate Alfajores', 300, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Bombón de Nuez con Chocolate  (3 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Bombón de Nuez con Chocolate', 'bombon-de-nuez-con-chocolate', (select id from recipe_categories where slug = 'bombones'), 1, 'unidades', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Nueces', 8, 'g'),
    ('Dulce de Leche', 10, 'g'),
    ('Chocolate Alfajores', 10, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Torta Galesa  (9 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Torta Galesa', 'torta-galesa', (select id from recipe_categories where slug = 'tortas'), 2, 'porciones', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 200, 'g'),
    ('Huevo', 2, 'unidad'),
    ('Nueces', 100, 'g'),
    ('Harina Leudante', 400, 'g'),
    ('Coñac', 100, 'ml'),
    ('Azúcar Negro', 200, 'g'),
    ('Chocolate Alfajores', 100, 'g'),
    ('Ciruelas', 100, 'g'),
    ('Pasas de Uva', 100, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Torta de Manteca ODRA  (7 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Torta de Manteca ODRA', 'torta-de-manteca-odra', (select id from recipe_categories where slug = 'tortas'), 1, 'porciones', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 250, 'g'),
    ('Harina 0000', 250, 'g'),
    ('Cacao', 30, 'g'),
    ('Huevo', 5, 'unidad'),
    ('Azúcar Común', 250, 'g'),
    ('Chocolate Taza', 60, 'g'),
    ('Polvo de Hornear', 10, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Crema Bariloche  (5 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Crema Bariloche', 'crema-bariloche', (select id from recipe_categories where slug = 'tortas'), 1, 'porciones', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 60, 'g'),
    ('Chocolate Taza', 150, 'g'),
    ('Dulce de Leche', 400, 'g'),
    ('Crema', 120, 'ml'),
    ('Coñac', 30, 'ml')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Butter Cream ODRA  (3 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Butter Cream ODRA', 'butter-cream-odra', (select id from recipe_categories where slug = 'tortas'), 1, 'porciones', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 500, 'g'),
    ('Huevo', 4, 'unidad'),
    ('Azúcar Común', 400, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

-- Genoise  (4 ingredientes)
with nueva as (
  insert into recipes (name, slug, category_id, yield_quantity, yield_unit, is_active)
  values ('Genoise', 'genoise', (select id from recipe_categories where slug = 'tortas'), 1, 'porciones', true)
  returning id
)
insert into recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
select nueva.id, rm.id, v.qty::numeric, v.unit::raw_material_unit
from nueva
  join (values
    ('Manteca', 40, 'g'),
    ('Harina 0000', 180, 'g'),
    ('Huevo', 6, 'unidad'),
    ('Azúcar Común', 180, 'g')
  ) as v(mp_name, qty, unit) on true
  join raw_materials rm on rm.name = v.mp_name;

commit;

-- Verificación
select r.name, rc.total_cost, rc.cost_per_unit,
       (select count(*) from recipe_ingredients ri where ri.recipe_id = r.id) as n_ingredientes
from recipes r left join recipe_costs rc on rc.recipe_id = r.id
order by r.name;

-- ============================================================
-- Reset de datos de negocio — La Patisserie
-- ============================================================
-- Borra TODOS los datos de negocio y deja la base lista para
-- una carga desde cero. Reejecutable.
--
-- NO toca:
--   - Estructura (tablas, tipos, funciones, triggers, vistas)
--   - suppliers, supplier_catalog (filas)  → listas de proveedores
--   - recipe_categories, product_categories, overhead_settings
--   - app_settings                          → config del sistema
--
-- Usa DELETE (no TRUNCATE) porque supplier_catalog tiene un FK
-- hacia raw_materials y se conserva. El orden respeta las FKs.
-- ============================================================

begin;

delete from order_items;
delete from orders;
delete from stock_movements;
delete from recipe_ingredients;
delete from product_variants;
delete from products;
delete from recipes;                       -- raw_materials.recipe_id / products.recipe_id → SET NULL (auto)
delete from raw_material_price_history;
delete from raw_materials;                  -- supplier_catalog.raw_material_id → SET NULL (auto)
delete from customers;
delete from clients;

-- Desvincular el catálogo de proveedores de las materias primas borradas
-- (idempotente: el DELETE anterior ya dejó estos valores en NULL).
update supplier_catalog set raw_material_id = null;

-- Reiniciar la numeración de pedidos (LP-AAAA-0001).
alter sequence order_number_seq restart with 1;

commit;

-- ─── Verificación ───────────────────────────────────────────
-- Debe dar 0 en todas las de negocio y mantener las de referencia.

select 'raw_materials'              as tabla, count(*) from raw_materials
union all select 'raw_material_price_history', count(*) from raw_material_price_history
union all select 'recipes',                    count(*) from recipes
union all select 'recipe_ingredients',         count(*) from recipe_ingredients
union all select 'products',                   count(*) from products
union all select 'product_variants',           count(*) from product_variants
union all select 'stock_movements',            count(*) from stock_movements
union all select 'orders',                     count(*) from orders
union all select 'order_items',                count(*) from order_items
union all select 'customers',                  count(*) from customers
union all select 'clients',                    count(*) from clients
union all select '— conservadas —',            null
union all select 'suppliers',                  count(*) from suppliers
union all select 'supplier_catalog',           count(*) from supplier_catalog
union all select 'supplier_catalog c/ MP link', count(*) from supplier_catalog where raw_material_id is not null
union all select 'recipe_categories',          count(*) from recipe_categories
union all select 'product_categories',         count(*) from product_categories
union all select 'overhead_settings',          count(*) from overhead_settings
union all select 'app_settings',               count(*) from app_settings
order by tabla;

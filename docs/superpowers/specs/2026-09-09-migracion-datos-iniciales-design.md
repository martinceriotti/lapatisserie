# Migración de datos iniciales — La Patisserie

**Fecha:** 2026-09-09
**Estado:** Diseño aprobado, pendiente de plan de implementación

## 1. Contexto y objetivo

El sistema admin está construido (materias primas, recetas, productos, pedidos,
producción, stock, dashboard) pero la base de datos tiene datos de prueba
mezclados. Hay que dejarla en cero y cargar los datos reales de la pastelería:

1. **Reset** — borrar todos los datos de negocio, dejar un script reutilizable.
2. **Materias primas** — cargar los ~54 insumos con sus precios.
3. **Recetas** — migrar el set real de trabajo (~31 recetas) desde el Excel de
   costos, en formato plano (ingredientes crudos, sin sub-recetas).

Fuente de datos: `docs/Costos Pattiserie Septiembre 2024.xlsx` (los precios que
dice "septiembre 2024" son los vigentes según Martin).

El mapeo con proveedores (`supplier_catalog`) queda **fuera de alcance** en esta
etapa; esas tablas se conservan intactas para mapear más adelante.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Acceso a la DB | Claude escribe los `.sql`; Martin los corre en el SQL Editor y pega la salida |
| Alcance del reset | Solo borrar datos de negocio. No toca estructura ni tablas de referencia |
| Precios de MP | Fuente: hoja "Valores y Totales" del Excel |
| Proveedores | No se tocan `suppliers` ni `supplier_catalog` (se conservan las listas cargadas) |
| Alcance de recetas | Set de la hoja "Frecuentes" (~48 filas → ~31 a migrar) |
| Intermedios | Migración plana como está en el Excel. Reestructurar en intermedios se evalúa después |

## 3. Estado verificado de la DB (2026-09-09)

Verificado por introspección contra la DB publicada. El repo
(`supabase/schema.sql` + migraciones) **está desactualizado**; la DB real es la
referencia.

**Tablas (18) + 2 vistas** (`recipe_costs`, `product_profitability`).

`raw_materials` tiene columnas que el schema del repo no refleja:
`stock_quantity` (default 0), `material_type` (text, default `'materia_prima'`),
`recipe_id` (FK → recipes, SET NULL), `sale_price` (numeric, nullable).
`price_per_gram` **sigue siendo columna generada** (kg/g/l/ml ÷ 1000, resto tal
cual) — no se escribe nunca.

Enums relevantes:
- `raw_material_unit`: `g, kg, ml, l, unidad, sobre, taza`
- `raw_material_category`: `dairy, flour, chocolate, sugar, fruit, packaging,
  other, eggs, nuts, powders` (+ valores de tipo-producto que no se usan para MP)
- `recipe_yield_unit`: `unidades, porciones, gramos, kg`

FKs que apuntan a `raw_materials` (relevante para el orden de borrado):

| Tabla origen | Columna | ON DELETE |
|---|---|---|
| `order_items` | `raw_material_id` | SET NULL |
| `raw_material_price_history` | `raw_material_id` | CASCADE |
| `recipe_ingredients` | `raw_material_id` | RESTRICT |
| `stock_movements` | `raw_material_id` | CASCADE |
| `supplier_catalog` | `raw_material_id` | SET NULL |

Datos de referencia actuales (se conservan, **no** se re-siembran):
- `recipe_categories`: 10 filas
- `product_categories`: 8 filas
- `overhead_settings`: 4 filas (`Mano de obra` 20%, `Packaging promedio` 5%,
  `Gas / electricidad` 3%, `Varios` 2%)
- `app_settings`: 1 fila (`id=1`, `sale_price_factor`, `deposit_pct`)

## 4. Fase A — Reset de datos

**Entregable:** `supabase/scripts/reset_data.sql` (reejecutable).

### Enfoque

No se puede usar `TRUNCATE` sobre `raw_materials` porque `supplier_catalog`
—que se conserva— tiene un FK hacia ella (Postgres bloquea el TRUNCATE aunque
los valores estén en NULL). Se usa **`DELETE` en orden de dependencias**. A la
escala del proyecto (~54 MP, ~31 recetas, pedidos de prueba) es instantáneo.

### Contenido del script

```sql
begin;

-- Datos de negocio, hijos → padres
delete from order_items;
delete from orders;
delete from stock_movements;
delete from recipe_ingredients;
delete from product_variants;
delete from products;
delete from recipes;                    -- raw_materials.recipe_id y products.recipe_id → SET NULL (auto)
delete from raw_material_price_history;
delete from raw_materials;              -- supplier_catalog.raw_material_id → SET NULL (auto)
delete from customers;
delete from clients;

-- Desvincular catálogo de proveedores (idempotente; el DELETE anterior ya lo hizo)
update supplier_catalog set raw_material_id = null;

-- Reiniciar numeración de pedidos
alter sequence order_number_seq restart with 1;

commit;
```

**No se tocan:** `suppliers`, `supplier_catalog` (filas), `recipe_categories`,
`product_categories`, `overhead_settings`, `app_settings`.

### Verificación

Query de conteo post-reset: todas las tablas de negocio en 0, las de referencia
sin cambios, `supplier_catalog` con la misma cantidad de filas y
`raw_material_id` todo en NULL.

## 5. Fase B — Materias primas

**Entregables:**
- `scripts/migracion/materias_primas.csv` — tabla de revisión (generada, la
  corrige Martin)
- `supabase/seeds/001_materias_primas.sql` — generado desde el CSV corregido

### Modelo de datos

Cada insumo → una fila en `raw_materials`:

| Campo | Valor |
|---|---|
| `name` | nombre del Excel, normalizado (sin dobles espacios) |
| `unit` | `kg` (sólidos a granel), `l` (líquidos), `unidad` (huevo, limón, naranja, manzana, yogur, envases), `sobre` (levadura, gelatina) |
| `category` | inferida (`dairy`, `flour`, `chocolate`, `sugar`, `fruit`, `eggs`, `nuts`, `powders`, `packaging`, `other`) |
| `current_price` | precio por unidad elegida, de la hoja "Valores y Totales" |
| `material_type` | `'materia_prima'` |
| `stock_quantity` | `0` |
| `is_active` | `true` |

`price_per_gram` se calcula solo. La consistencia con el Excel se apoya en que
`recipe_costs` hace `quantity * price_per_gram`: para `kg`/`l` divide el precio
por 1000 (⇒ quantity en gramos/ml), para `unidad`/`sobre` usa el precio tal cual
(⇒ quantity en unidades). Ambos casos reproducen el costo de línea del Excel.

### Tabla de revisión

Se entrega un CSV con columnas
`nombre_excel, unit, category, current_price, xls_per_kg, xls_per_gram, REVISAR`.
Martin corrige las filas marcadas `REVISAR` (~12) y valida el resto.

Filas marcadas para revisar y por qué:

| Insumo | Motivo |
|---|---|
| Conac | Excel inconsistente: $10.000/kg vs $13,33/g. Propuesta: $13.333/l (lo que usan las recetas) |
| Nutella | $860/kg claramente mal (debería rondar $15.000+) |
| Biscochuelo | $130/kg parece muy bajo (¿mezcla comprada?) |
| Frutos Rojos | $150/kg muy bajo |
| Mix Europeo | $600/kg muy bajo para fruta abrillantada |
| Leche Condensada | $170/unidad parece precio viejo |
| Gelatina SS | $6/sobre — confirmar |
| Yogur | confirmar si la unidad es "pote" |
| Peras | Excel inconsistente: kg=600 vs g=10 |
| Pirotines | $1,25 c/u — confirmar |
| Oreo | precio de paquete, `g` raro (130,3) |

### Carga opcional de historial

Insertar una fila por MP en `raw_material_price_history` con `effective_date =
current_date` y `notes = 'Carga inicial'`, para que el historial no arranque
vacío. (El trigger sólo registra en UPDATE, no en INSERT.) — **A confirmar con
Martin.**

## 6. Fase C — Recetas

**Entregables:**
- `docs/migracion/recetas_map.csv` — mapeo Frecuentes → hoja (generado, lo
  corrige Martin)
- `supabase/seeds/002_recetas.sql` — generado desde el CSV corregido + el Excel

### Estructura de las hojas de receta

Cada hoja tiene: fila de encabezado
(`Ingrediente | Gramos | Precio | Total Recetas | Cantidad de Recetas: | N`),
una lista de ingredientes con cantidad (`Gramos`) y costo de línea (`Precio`), y
un pie con `Cantidad de Masitas/Porciones`, `Costo Receta`, `Costo Individual`.

### Workflow

1. **Generar `recetas_map.csv`** con:
   `nombre_frecuentes | hoja_excel | categoria_slug | rinde | unidad_rinde | accion`
   donde `accion ∈ {migrar, revisar, omitir}`.
2. **Martin corrige el CSV** — confirma la hoja de cada receta, ajusta
   categoría / rinde, marca las que no van.
3. **Generador** lee el CSV corregido, extrae ingredientes de cada hoja y
   produce `002_recetas.sql`.
4. **Match de ingredientes**: cada ingrediente de receta se busca por nombre
   normalizado contra las MP de la fase B. Los que no matcheen se reportan
   (no se inserta la receta con ingredientes faltantes sin avisar).

### Mapeo a la tabla `recipes`

| Campo | Valor |
|---|---|
| `name` | nombre de "Frecuentes" |
| `slug` | slug del nombre (único; si colisiona, se sufija) |
| `category_id` | lookup por `slug` en `recipe_categories` |
| `yield_quantity` | `Cantidad de Masitas/Porciones` del pie de la hoja |
| `yield_unit` | `unidades` o `porciones` según la hoja |
| `is_active` | `true` |

`recipe_ingredients`: `quantity` = columna `Gramos` de la hoja; `unit` = `g` para
insumos por peso, `unidad`/`sobre` para los de conteo (cosmético — la vista de
costos ignora `unit`).

### Estado del mapeo (borrador, sujeto a revisión de Martin)

- **~31 a migrar directo** — hoja identificada, categoría razonable.
- **~10 a revisar** — hoja ambigua, o es un intermedio (Ganache, Genoise,
  Crema Bariloche, Butter Cream ODRA), o categoría dudosa.
- **~6 a omitir** — variantes sin hoja propia (Brownies DDL/Bariloche 20/24 cm)
  o que comparten hoja con otra (Torta Forrada 15/18/20 cm), o la hoja tiene
  `#REF!`.

### Costos: diferencia esperada con el Excel

El costo que calcule `recipe_costs` **no** va a coincidir exacto con el Excel:
el Excel aplica su propio overhead y asume todo en gramos; el sistema tiene
`overhead_settings` (30% total) y su propia lógica. La validación es de orden de
magnitud, no exacta, y se hace al final.

## 7. Estructura de archivos

```
scripts/migracion/
  extract_excel.py         # extrae ingredientes + recetas del xlsx a JSON
  gen_materias_primas.py    # CSV de revisión → 001_materias_primas.sql
  gen_recetas.py            # recetas_map.csv + xlsx → 002_recetas.sql
  materias_primas.csv       # tabla de revisión (editada por Martin)

docs/migracion/
  recetas_map.csv           # mapeo Frecuentes→hoja (editado por Martin)

supabase/
  scripts/reset_data.sql    # Fase A (reejecutable)
  seeds/001_materias_primas.sql
  seeds/002_recetas.sql
```

## 8. Criterios de éxito

- **Fase A:** post-reset, tablas de negocio en 0; referencia y `supplier_catalog`
  intactas; `order_number_seq` reiniciada.
- **Fase B:** 54 MP en `raw_materials` (o el número que quede tras la revisión);
  cero filas con `current_price = 0` salvo que Martin lo decida; categorías y
  unidades validadas.
- **Fase C:** las recetas marcadas `migrar` cargadas con todos sus ingredientes
  linkeados; reporte de ingredientes sin match vacío o resuelto; `recipe_costs`
  devuelve un costo por receta del orden esperado.
- Se prueban después los módulos de productos, pedidos y producción sobre estos
  datos.

## 9. Fuera de alcance

- Mapeo `supplier_catalog` ↔ `raw_materials`.
- Reestructurar recetas en intermedios / sub-recetas.
- Cargar productos, clientes, pedidos.
- Actualizar `supabase/schema.sql` para reflejar la DB real (deuda técnica
  separada).
- Importación de nuevas listas de precios de proveedores.

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| Precios del Excel viejos/erróneos | Tabla de revisión con flags; Martin valida antes de correr |
| Nombres de ingredientes que no matchean entre recetas y MP | El generador reporta faltantes; se resuelven con un diccionario de alias |
| Nombres de hoja mal asignados en el mapeo | Martin revisa `recetas_map.csv` antes de generar |
| El `DELETE` falla por un FK no previsto | Script en una transacción (`begin/commit`); si falla, rollback y se ajusta el orden |
| La DB vuelve a derivar del repo | Se documenta; actualizar `schema.sql` queda como tarea aparte |

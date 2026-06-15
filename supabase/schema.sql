-- ============================================================
-- La Patisserie — Schema de base de datos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ─── Materias Primas ────────────────────────────────────────

create type raw_material_unit as enum ('g', 'kg', 'ml', 'l', 'unidad', 'sobre', 'taza');
create type raw_material_category as enum ('dairy', 'flour', 'chocolate', 'sugar', 'fruit', 'packaging', 'other');

create table raw_materials (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  description   text,
  unit          raw_material_unit not null default 'g',
  category      raw_material_category not null default 'other',
  current_price numeric(12, 2) not null default 0,
  -- precio por gramo, calculado automáticamente al actualizar current_price
  price_per_gram numeric(16, 6) generated always as (
    case unit
      when 'kg'     then current_price / 1000
      when 'g'      then current_price / 1000  -- precio viene x kg
      when 'l'      then current_price / 1000
      when 'ml'     then current_price / 1000
      else current_price  -- unidad, sobre, taza: precio x unidad
    end
  ) stored,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table raw_material_price_history (
  id                uuid primary key default uuid_generate_v4(),
  raw_material_id   uuid not null references raw_materials(id) on delete cascade,
  price             numeric(12, 2) not null,
  effective_date    date not null default current_date,
  notes             text,
  created_at        timestamptz not null default now()
);

-- Trigger: guarda historial automáticamente al cambiar el precio
create or replace function log_price_change()
returns trigger as $$
begin
  if old.current_price <> new.current_price then
    insert into raw_material_price_history (raw_material_id, price, effective_date)
    values (new.id, new.current_price, current_date);
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger raw_material_price_change
  before update on raw_materials
  for each row execute function log_price_change();

-- ─── Gastos Fijos / Overhead ────────────────────────────────

create type overhead_type as enum ('percentage', 'fixed_amount');

create table overhead_settings (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  type        overhead_type not null default 'percentage',
  value       numeric(10, 4) not null default 0,
  is_active   boolean not null default true
);

-- Valores por defecto
insert into overhead_settings (name, type, value) values
  ('Mano de obra', 'percentage', 20),
  ('Packaging promedio', 'percentage', 5),
  ('Gas / electricidad', 'percentage', 3);

-- ─── Categorías de Recetas ──────────────────────────────────

create table recipe_categories (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  display_order int not null default 0
);

insert into recipe_categories (name, slug, display_order) values
  ('Tortas',         'tortas',         1),
  ('Alfajores',      'alfajores',      2),
  ('Cookies',        'cookies',        3),
  ('Brownies',       'brownies',       4),
  ('Budines',        'budines',        5),
  ('Cakepops',       'cakepops',       6),
  ('Donas',          'donas',          7),
  ('Mini Pastelería','mini-pasteleria',8),
  ('Postres',        'postres',        9),
  ('Bombones',       'bombones',       10);

-- ─── Recetas ────────────────────────────────────────────────

create type recipe_yield_unit as enum ('unidades', 'porciones', 'gramos', 'kg');
create type recipe_difficulty as enum ('facil', 'medio', 'dificil');

create table recipes (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text not null unique,
  description     text,
  category_id     uuid references recipe_categories(id) on delete set null,
  yield_quantity  numeric(10, 2) not null default 1,
  yield_unit      recipe_yield_unit not null default 'unidades',
  prep_time_min   int,
  difficulty      recipe_difficulty,
  notes           text,
  image_url       text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table recipe_ingredients (
  id                uuid primary key default uuid_generate_v4(),
  recipe_id         uuid not null references recipes(id) on delete cascade,
  raw_material_id   uuid not null references raw_materials(id) on delete restrict,
  quantity          numeric(12, 4) not null,
  unit              raw_material_unit not null default 'g',
  notes             text,
  unique (recipe_id, raw_material_id)
);

-- Vista: costo de cada receta calculado en tiempo real
-- Separado en CTEs para evitar agregados anidados (no permitidos en PostgreSQL)
create or replace view recipe_costs as
with ingredient_totals as (
  -- Paso 1: sumar el costo de ingredientes por receta
  select
    r.id                                            as recipe_id,
    r.name                                          as recipe_name,
    r.yield_quantity,
    r.yield_unit,
    coalesce(sum(ri.quantity * rm.price_per_gram), 0) as ingredient_cost
  from recipes r
  left join recipe_ingredients ri on ri.recipe_id = r.id
  left join raw_materials rm on rm.id = ri.raw_material_id
  group by r.id, r.name, r.yield_quantity, r.yield_unit
),
overhead_totals as (
  -- Paso 2: aplicar cada overhead sobre el costo de ingredientes ya calculado
  select
    it.recipe_id,
    coalesce(sum(
      case os.type
        when 'percentage'   then it.ingredient_cost * os.value / 100
        when 'fixed_amount' then os.value
      end
    ), 0) as overhead_cost
  from ingredient_totals it
  cross join overhead_settings os
  where os.is_active
  group by it.recipe_id, it.ingredient_cost
)
select
  it.recipe_id,
  it.recipe_name,
  it.yield_quantity,
  it.yield_unit,
  it.ingredient_cost,
  coalesce(ot.overhead_cost, 0)                               as overhead_cost,
  it.ingredient_cost + coalesce(ot.overhead_cost, 0)         as total_cost,
  case when it.yield_quantity > 0 then
    (it.ingredient_cost + coalesce(ot.overhead_cost, 0)) / it.yield_quantity
  else 0 end                                                  as cost_per_unit
from ingredient_totals it
left join overhead_totals ot on ot.recipe_id = it.recipe_id;

-- ─── Categorías de Productos ────────────────────────────────

create table product_categories (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  description   text,
  display_order int not null default 0,
  image_url     text
);

insert into product_categories (name, slug, description, display_order) values
  ('Mesas Dulces',        'mesas-dulces',    'El corazón de tu fiesta',                   1),
  ('Tortas',              'tortas',          'Tortas personalizadas para cada evento',     2),
  ('Tortas Piñata',       'tortas-pinata',   'La sorpresa dentro de la sorpresa',         3),
  ('Cakepops',            'cakepops',        'Un mundo de sabor en cada palito',          4),
  ('Donas',               'donas',           'Tiernas, coloridas e irresistibles',        5),
  ('Mini Pastelería',     'mini-pasteleria', 'Pequeños bocados, grandes momentos',        6),
  ('Clases',              'clases',          'Aprendé con nosotros',                      7);

-- ─── Productos ──────────────────────────────────────────────

create type price_display as enum ('from', 'consult', 'fixed');

create table products (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  slug                text not null unique,
  short_description   text,
  description         text,
  category_id         uuid references product_categories(id) on delete set null,
  recipe_id           uuid references recipes(id) on delete set null,
  base_price          numeric(12, 2),
  price_display       price_display not null default 'consult',
  min_order_qty       int not null default 1,
  is_featured         boolean not null default false,
  is_active           boolean not null default true,
  images              text[] not null default '{}',
  tags                text[] not null default '{}',
  seo_title           text,
  seo_description     text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table product_variants (
  id                uuid primary key default uuid_generate_v4(),
  product_id        uuid not null references products(id) on delete cascade,
  name              text not null,
  additional_cost   numeric(12, 2) not null default 0,
  price_override    numeric(12, 2),
  is_active         boolean not null default true
);

-- Vista: producto con su costo calculado y margen
create or replace view product_profitability as
select
  p.id,
  p.name,
  p.base_price,
  rc.total_cost                                         as cost_price,
  case when p.base_price > 0 and rc.total_cost > 0 then
    round(((p.base_price - rc.total_cost) / p.base_price * 100)::numeric, 1)
  else null end                                         as margin_pct,
  case
    when p.base_price > 0 and rc.total_cost > 0 then
      case
        when ((p.base_price - rc.total_cost) / p.base_price * 100) >= 70 then 'green'
        when ((p.base_price - rc.total_cost) / p.base_price * 100) >= 60 then 'yellow'
        else 'red'
      end
    else 'unknown'
  end                                                   as margin_status
from products p
left join recipe_costs rc on rc.recipe_id = p.recipe_id;

-- ─── Clientes ───────────────────────────────────────────────

create table customers (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  email         text,
  phone         text,
  address       text,
  neighborhood  text,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ─── Pedidos ────────────────────────────────────────────────

create type order_status as enum (
  'borrador', 'presupuestado', 'confirmado',
  'en_produccion', 'listo', 'entregado', 'pagado', 'cancelado'
);
create type payment_status as enum ('pending', 'partial', 'paid');

create sequence order_number_seq start 1;

create table orders (
  id              uuid primary key default uuid_generate_v4(),
  order_number    text not null unique default ('LP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 4, '0')),
  customer_id     uuid not null references customers(id) on delete restrict,
  event_date      date,
  delivery_date   date,
  status          order_status not null default 'borrador',
  subtotal        numeric(12, 2) not null default 0,
  discount        numeric(12, 2) not null default 0,
  total           numeric(12, 2) generated always as (subtotal - discount) stored,
  payment_status  payment_status not null default 'pending',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table order_items (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references orders(id) on delete cascade,
  product_id      uuid not null references products(id) on delete restrict,
  variant_id      uuid references product_variants(id) on delete set null,
  quantity        int not null default 1 check (quantity > 0),
  unit_price      numeric(12, 2) not null,
  customization   text,
  notes           text
);

-- ─── RLS (Row Level Security) ───────────────────────────────

alter table raw_materials             enable row level security;
alter table raw_material_price_history enable row level security;
alter table overhead_settings          enable row level security;
alter table recipe_categories          enable row level security;
alter table recipes                    enable row level security;
alter table recipe_ingredients         enable row level security;
alter table product_categories         enable row level security;
alter table products                   enable row level security;
alter table product_variants           enable row level security;
alter table customers                  enable row level security;
alter table orders                     enable row level security;
alter table order_items                enable row level security;

-- Lectura pública para catálogo
create policy "public can read active products"
  on products for select using (is_active = true);

create policy "public can read product categories"
  on product_categories for select using (true);

create policy "public can read active recipes"
  on recipes for select using (is_active = true);

create policy "public can read recipe categories"
  on recipe_categories for select using (true);

-- Admin tiene acceso total (via service role key en el servidor)
-- Las políticas de admin se gestionan desde el servidor con service role

-- ─── Índices ────────────────────────────────────────────────

create index on products (category_id);
create index on products (is_active, is_featured);
create index on products (slug);
create index on recipes (category_id);
create index on recipes (slug);
create index on recipe_ingredients (recipe_id);
create index on recipe_ingredients (raw_material_id);
create index on orders (customer_id);
create index on orders (status);
create index on orders (event_date);
create index on order_items (order_id);
create index on raw_material_price_history (raw_material_id, effective_date desc);

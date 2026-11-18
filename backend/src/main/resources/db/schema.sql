-- DomiFlow PostgreSQL schema for Supabase
-- Target: PostgreSQL 15+ / Supabase. Run on a new database before starting Spring Boot.
-- IDs are UUIDs; all money values are whole Colombian pesos (COP).
-- The Spring API connects with JDBC, so authorization is enforced by the API layer.

begin;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Reference data
-- -----------------------------------------------------------------------------
create table roles (
  code text primary key,
  name text not null unique,
  description text not null default '',
  active boolean not null default true
);

insert into roles(code, name, description) values
  ('CLIENTE', 'Cliente', 'Compra y seguimiento de pedidos'),
  ('COMERCIO', 'Comercio', 'Administra un establecimiento y sus pedidos'),
  ('REPARTIDOR', 'Repartidor', 'Recoge y entrega pedidos'),
  ('ADMINISTRADOR', 'Administrador', 'Administra la plataforma y el CRM')
on conflict (code) do update set name=excluded.name, description=excluded.description;

create table business_categories (
  code text primary key,
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into business_categories(code, name) values
  ('Restaurantes', 'Restaurantes'), ('Mercado', 'Mercado'), ('Farmacia', 'Farmacia')
on conflict (code) do nothing;

create table service_areas (
  code text primary key,
  name text not null,
  city text not null default 'Bogotá',
  department text not null default 'Cundinamarca',
  active boolean not null default true,
  unique (name, city)
);

insert into service_areas(code, name) values
  ('Chapinero', 'Chapinero'), ('Usaquén', 'Usaquén'), ('Cedritos', 'Cedritos')
on conflict (code) do nothing;

create table order_statuses (
  code text primary key,
  label text not null unique,
  sort_order smallint not null unique,
  terminal boolean not null default false
);

insert into order_statuses(code,label,sort_order,terminal) values
  ('PENDIENTE','Pendiente',10,false), ('CONFIRMADO','Confirmado',20,false),
  ('EN_PREPARACION','En preparación',30,false), ('LISTO_PARA_RECOGER','Listo para recoger',40,false),
  ('EN_CAMINO','En camino',50,false), ('ENTREGADO','Entregado',60,true),
  ('CANCELADO','Cancelado',70,true), ('RECHAZADO','Rechazado',80,true)
on conflict (code) do update set label=excluded.label,sort_order=excluded.sort_order,terminal=excluded.terminal;

create table payment_statuses (
  code text primary key,
  label text not null unique,
  terminal boolean not null default false
);

insert into payment_statuses(code,label,terminal) values
  ('PENDIENTE','Pendiente',false), ('APROBADO','Aprobado',true), ('RECHAZADO','Rechazado',true)
on conflict (code) do update set label=excluded.label,terminal=excluded.terminal;

create table delivery_statuses (
  code text primary key,
  label text not null unique,
  sort_order smallint not null unique,
  terminal boolean not null default false
);

insert into delivery_statuses(code,label,sort_order,terminal) values
  ('PENDIENTE','Pendiente',10,false), ('ASIGNADA','Asignada',20,false),
  ('RECOGIDA','Recogida',30,false), ('EN_CAMINO','En camino',40,false),
  ('ENTREGADA','Entregada',50,true), ('CANCELADA','Cancelada',60,true)
on conflict (code) do update set label=excluded.label,sort_order=excluded.sort_order,terminal=excluded.terminal;

create table payment_methods (
  code text primary key,
  name text not null unique,
  active boolean not null default true
);

insert into payment_methods(code,name) values
  ('TARJETA','Tarjeta'), ('PSE','PSE'), ('EFECTIVO','Efectivo')
on conflict (code) do update set name=excluded.name;

-- -----------------------------------------------------------------------------
-- Identity, customer, employee and courier profiles
-- -----------------------------------------------------------------------------
create table app_users (
  id uuid primary key default gen_random_uuid(),
  role text not null references roles(code) on update cascade on delete restrict,
  name text not null check (length(btrim(name)) between 3 and 120),
  email text not null,
  phone text not null default '',
  avatar_url text not null default '',
  password_hash text not null,
  active boolean not null default true,
  available boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index app_users_email_lower_uq on app_users(lower(email));
create index app_users_role_active_idx on app_users(role, active);

create table customer_profiles (
  user_id uuid primary key references app_users(id) on delete cascade,
  marketing_opt_in boolean not null default false,
  preferred_language text not null default 'es-CO',
  created_at timestamptz not null default now()
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references app_users(id) on delete set null,
  name text not null check (length(btrim(name)) between 3 and 150),
  type text not null check (type in ('DIRECTO','INDIRECTO')),
  position text not null,
  document text not null unique,
  active boolean not null default true,
  hired_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table courier_profiles (
  user_id uuid primary key references app_users(id) on delete cascade,
  vehicle_type text check (vehicle_type in ('BICICLETA','MOTO','CARRO','OTRO')),
  vehicle_plate text,
  verification_status text not null default 'PENDIENTE'
    check (verification_status in ('PENDIENTE','VERIFICADO','RECHAZADO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function ensure_role_profile() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old.role = new.role then
    return new;
  end if;
  if new.role = 'CLIENTE' then
    insert into customer_profiles(user_id) values (new.id) on conflict (user_id) do nothing;
  elsif new.role = 'REPARTIDOR' then
    insert into courier_profiles(user_id) values (new.id) on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger app_users_ensure_role_profile
  after insert or update on app_users
  for each row execute function ensure_role_profile();

-- -----------------------------------------------------------------------------
-- Addresses, merchants, opening hours and catalog
-- -----------------------------------------------------------------------------
create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  label text not null check (length(btrim(label)) between 1 and 50),
  street text not null check (length(btrim(street)) >= 5),
  city text not null default 'Bogotá',
  neighborhood text not null default '',
  postal_code text not null default '',
  notes text not null default '',
  latitude double precision,
  longitude double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null)),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create index addresses_user_created_idx on addresses(user_id, created_at);
create unique index addresses_one_default_per_user_uq on addresses(user_id) where is_default;

create table merchants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references app_users(id) on delete restrict,
  category text not null references business_categories(code) on update cascade on delete restrict,
  area text not null default 'Chapinero' references service_areas(code) on update cascade on delete restrict,
  name text not null check (length(btrim(name)) between 2 and 150),
  description text not null default '',
  emoji text not null default '🍽️',
  image_url text not null default '',
  contact text not null default '',
  opening_hours jsonb not null default '{}'::jsonb,
  open boolean not null default false,
  active boolean not null default true,
  delivery_fee integer not null default 3000 check (delivery_fee >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index merchants_active_category_area_idx on merchants(active, category, area);
create index merchants_owner_idx on merchants(owner_id);

create table merchant_hours (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  closes_next_day boolean not null default false,
  is_closed boolean not null default false,
  timezone_name text not null default 'America/Bogota',
  unique (merchant_id, day_of_week),
  check (is_closed or (opens_at is not null and closes_at is not null and opens_at <> closes_at))
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (merchant_id, name),
  unique (id, merchant_id)
);

create index categories_merchant_active_idx on categories(merchant_id, active, name);

create table products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete restrict,
  category_id uuid not null,
  name text not null check (length(btrim(name)) between 1 and 150),
  description text not null default '',
  emoji text not null default '🍽️',
  image_url text not null default '',
  price integer not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, merchant_id),
  constraint products_category_same_merchant_fk
    foreign key (category_id, merchant_id) references categories(id, merchant_id) on delete restrict
);

create index products_merchant_active_idx on products(merchant_id, active, name);
create index products_category_idx on products(category_id);

create table product_inventory (
  product_id uuid primary key references products(id) on delete cascade,
  available_quantity integer not null default 0 check (available_quantity >= 0),
  updated_at timestamptz not null default now()
);

create function initialize_product_inventory() returns trigger
language plpgsql as $$
begin
  insert into product_inventory(product_id, available_quantity) values (new.id, 0)
  on conflict (product_id) do nothing;
  return new;
end;
$$;

create trigger products_initialize_inventory
  after insert on products
  for each row execute function initialize_product_inventory();

create table favorites (
  user_id uuid not null references app_users(id) on delete cascade,
  merchant_id uuid not null references merchants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, merchant_id)
);

create index favorites_merchant_idx on favorites(merchant_id);

-- -----------------------------------------------------------------------------
-- Promotions, coupon codes and durable shopping carts
-- -----------------------------------------------------------------------------
create table promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  discount_type text not null check (discount_type in ('PERCENTAGE','FIXED')),
  discount_value integer not null check (discount_value > 0),
  min_subtotal integer not null default 0 check (min_subtotal >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz,
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (discount_type <> 'PERCENTAGE' or discount_value <= 100)
);

create table promotion_merchants (
  promotion_id uuid not null references promotions(id) on delete cascade,
  merchant_id uuid not null references merchants(id) on delete cascade,
  primary key (promotion_id, merchant_id)
);

create index promotion_merchants_merchant_idx on promotion_merchants(merchant_id, promotion_id);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(btrim(code))),
  promotion_id uuid not null references promotions(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index coupons_promotion_active_idx on coupons(promotion_id, active);

create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  merchant_id uuid not null references merchants(id) on delete restrict,
  status text not null default 'ACTIVO' check (status in ('ACTIVO','CONVERTIDO','ABANDONADO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, merchant_id)
);

create unique index carts_one_active_per_user_uq on carts(user_id) where status='ACTIVO';
create index carts_user_status_updated_idx on carts(user_id, status, updated_at desc);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null,
  merchant_id uuid not null,
  product_id uuid not null,
  quantity integer not null check (quantity between 1 and 100),
  added_at timestamptz not null default now(),
  unique (cart_id, product_id),
  foreign key (cart_id, merchant_id) references carts(id, merchant_id) on delete cascade,
  foreign key (product_id, merchant_id) references products(id, merchant_id) on delete restrict
);

create index cart_items_cart_idx on cart_items(cart_id);

-- -----------------------------------------------------------------------------
-- Orders, immutable line-item snapshots, status history, payments and delivery
-- -----------------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  code bigint generated by default as identity unique,
  customer_id uuid not null references app_users(id) on delete restrict,
  merchant_id uuid not null references merchants(id) on delete restrict,
  address_id uuid references addresses(id) on delete set null,
  address_snapshot text not null,
  subtotal integer not null check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0 and discount <= subtotal),
  delivery_fee integer not null check (delivery_fee >= 0),
  total integer not null check (total >= 0),
  coupon text,
  payment_method text not null references payment_methods(code) on update cascade on delete restrict,
  payment_status text not null default 'PENDIENTE' references payment_statuses(code) on update cascade on delete restrict,
  status text not null default 'PENDIENTE' references order_statuses(code) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, customer_id),
  check (total = subtotal - discount + delivery_fee)
);

create index orders_customer_created_idx on orders(customer_id, created_at desc);
create index orders_merchant_status_created_idx on orders(merchant_id, status, created_at desc);
create index orders_status_created_idx on orders(status, created_at desc);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  name_snapshot text not null,
  price_snapshot integer not null check (price_snapshot >= 0),
  quantity integer not null check (quantity between 1 and 100),
  emoji_snapshot text not null default '🍽️',
  line_total bigint generated always as (price_snapshot::bigint * quantity::bigint) stored
);

create index order_items_order_idx on order_items(order_id);
create index order_items_product_idx on order_items(product_id);

create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null references order_statuses(code) on update cascade on delete restrict,
  changed_by uuid references app_users(id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index order_events_order_created_idx on order_events(order_id, created_at);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete restrict,
  method text not null references payment_methods(code) on update cascade on delete restrict,
  amount integer not null check (amount >= 0),
  status text not null references payment_statuses(code) on update cascade on delete restrict,
  transaction_reference text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  attempt_number smallint not null check (attempt_number > 0),
  method text not null references payment_methods(code) on update cascade on delete restrict,
  amount integer not null check (amount >= 0),
  status text not null references payment_statuses(code) on update cascade on delete restrict,
  transaction_reference text not null unique,
  provider_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (order_id, attempt_number)
);

create index payment_attempts_order_idx on payment_attempts(order_id, attempt_number desc);

create table coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete restrict,
  order_id uuid not null unique,
  user_id uuid not null,
  discount_amount integer not null check (discount_amount >= 0),
  redeemed_at timestamptz not null default now(),
  foreign key (order_id, user_id) references orders(id, customer_id) on delete restrict
);

create index coupon_redemptions_user_time_idx on coupon_redemptions(user_id, redeemed_at desc);
create index coupon_redemptions_coupon_idx on coupon_redemptions(coupon_id, redeemed_at desc);

create table deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  status text not null default 'PENDIENTE' references delivery_statuses(code) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deliveries_status_created_idx on deliveries(status, created_at);

create table delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries(id) on delete cascade,
  courier_id uuid not null references app_users(id) on delete restrict,
  assigned_by uuid references app_users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  note text not null default '',
  check (unassigned_at is null or unassigned_at >= assigned_at)
);

create unique index delivery_one_current_courier_uq
  on delivery_assignments(delivery_id) where unassigned_at is null;
create index delivery_assignments_courier_idx on delivery_assignments(courier_id, assigned_at desc);

create table delivery_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries(id) on delete cascade,
  status text not null references delivery_statuses(code) on update cascade on delete restrict,
  changed_by uuid references app_users(id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index delivery_events_delivery_created_idx on delivery_events(delivery_id, created_at);

create table delivery_locations (
  id bigint generated always as identity primary key,
  delivery_id uuid not null references deliveries(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  recorded_at timestamptz not null default now()
);

create index delivery_locations_delivery_time_idx on delivery_locations(delivery_id, recorded_at desc);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete restrict,
  order_id uuid references orders(id) on delete restrict,
  changed_by uuid references app_users(id) on delete set null,
  movement_type text not null check (movement_type in ('RECEPCION','AJUSTE','RESERVA','VENTA','DEVOLUCION')),
  quantity_delta integer not null check (quantity_delta <> 0),
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (order_id, product_id, movement_type)
);

create index stock_movements_product_created_idx on stock_movements(product_id, created_at desc);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  text text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_read_created_idx on notifications(user_id, read, created_at desc);

create table ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique,
  customer_id uuid not null,
  merchant_score smallint not null check (merchant_score between 1 and 5),
  courier_score smallint not null check (courier_score between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  foreign key (order_id, customer_id) references orders(id, customer_id) on delete restrict
);

create index ratings_customer_created_idx on ratings(customer_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Updated-at maintenance and read models
-- -----------------------------------------------------------------------------
create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger app_users_set_updated_at before update on app_users
  for each row execute function set_updated_at();
create trigger employees_set_updated_at before update on employees
  for each row execute function set_updated_at();
create trigger courier_profiles_set_updated_at before update on courier_profiles
  for each row execute function set_updated_at();
create trigger addresses_set_updated_at before update on addresses
  for each row execute function set_updated_at();
create trigger merchants_set_updated_at before update on merchants
  for each row execute function set_updated_at();
create trigger products_set_updated_at before update on products
  for each row execute function set_updated_at();
create trigger product_inventory_set_updated_at before update on product_inventory
  for each row execute function set_updated_at();
create trigger promotions_set_updated_at before update on promotions
  for each row execute function set_updated_at();
create trigger carts_set_updated_at before update on carts
  for each row execute function set_updated_at();
create trigger orders_set_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger payments_set_updated_at before update on payments
  for each row execute function set_updated_at();
create trigger deliveries_set_updated_at before update on deliveries
  for each row execute function set_updated_at();

create view v_merchant_ratings as
select m.id as merchant_id,
       coalesce(round(avg(r.merchant_score)::numeric, 1), 0)::numeric(2,1) as rating,
       count(r.id)::bigint as rating_count
from merchants m
left join orders o on o.merchant_id = m.id
left join ratings r on r.order_id = o.id
group by m.id;

create view v_courier_ratings as
select da.courier_id as user_id,
       round(avg(r.courier_score)::numeric, 1)::numeric(2,1) as rating,
       count(r.id)::bigint as rating_count
from ratings r
join deliveries d on d.order_id = r.order_id
join delivery_assignments da on da.delivery_id = d.id and da.unassigned_at is null
group by da.courier_id;

create view v_product_catalog as
select p.id, p.merchant_id, p.category_id, p.name, p.description, p.emoji,
       p.price, p.active, coalesce(i.available_quantity, 0) as stock, p.image_url
from products p
left join product_inventory i on i.product_id = p.id;

commit;

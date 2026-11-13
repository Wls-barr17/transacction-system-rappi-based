-- Run this migration in the Supabase SQL editor before starting the API.
create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(), name text not null, email text not null unique,
  phone text not null default '', password_hash text not null,
  role text not null check (role in ('CLIENTE','COMERCIO','REPARTIDOR','ADMINISTRADOR')),
  active boolean not null default true, available boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists addresses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references app_users(id),
  label text not null, street text not null, city text not null default 'Bogotá', notes text not null default '',
  is_default boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists merchants (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null unique references app_users(id),
  name text not null, category text not null, description text not null default '', emoji text not null default '🍽️',
  area text not null default 'Chapinero', contact text not null default '', opening_hours jsonb not null default '{}'::jsonb,
  open boolean not null default false, active boolean not null default true,
  delivery_fee integer not null default 3000 check (delivery_fee >= 0), rating numeric(2,1) not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists categories (
  id uuid primary key default gen_random_uuid(), merchant_id uuid references merchants(id) on delete cascade,
  name text not null, active boolean not null default true, unique(merchant_id,name)
);
create table if not exists products (
  id uuid primary key default gen_random_uuid(), merchant_id uuid not null references merchants(id),
  category_id uuid references categories(id), name text not null, description text not null default '',
  emoji text not null default '🍽️', price integer not null check (price >= 0), stock integer not null default 0 check (stock >= 0),
  active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists orders (
  id uuid primary key default gen_random_uuid(), code bigserial unique, customer_id uuid not null references app_users(id),
  merchant_id uuid not null references merchants(id), address_id uuid not null references addresses(id),
  address_snapshot text not null, subtotal integer not null, discount integer not null default 0,
  delivery_fee integer not null, total integer not null, coupon text, payment_method text not null,
  payment_status text not null default 'PENDIENTE' check(payment_status in ('PENDIENTE','APROBADO','RECHAZADO')),
  status text not null default 'PENDIENTE' check(status in ('PENDIENTE','CONFIRMADO','EN_PREPARACION','LISTO_PARA_RECOGER','EN_CAMINO','ENTREGADO','CANCELADO','RECHAZADO')),
  created_at timestamptz not null default now()
);
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id), name_snapshot text not null, price_snapshot integer not null,
  quantity integer not null check(quantity > 0), emoji_snapshot text not null default '🍽️'
);
create table if not exists order_events (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references orders(id) on delete cascade,
  status text not null, created_at timestamptz not null default now()
);
create table if not exists payments (
  id uuid primary key default gen_random_uuid(), order_id uuid not null unique references orders(id),
  method text not null, amount integer not null, status text not null check(status in ('PENDIENTE','APROBADO','RECHAZADO')),
  transaction_reference text not null, created_at timestamptz not null default now()
);
create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(), order_id uuid not null unique references orders(id) on delete cascade,
  courier_id uuid references app_users(id), status text not null default 'PENDIENTE'
    check(status in ('PENDIENTE','ASIGNADA','RECOGIDA','EN_CAMINO','ENTREGADA','CANCELADA')),
  created_at timestamptz not null default now()
);
create table if not exists delivery_events (
  id uuid primary key default gen_random_uuid(), delivery_id uuid not null references deliveries(id) on delete cascade,
  status text not null, created_at timestamptz not null default now()
);
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references app_users(id) on delete cascade,
  text text not null, read boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists employees (
  id uuid primary key default gen_random_uuid(), user_id uuid unique references app_users(id) on delete set null, name text not null, type text not null check(type in ('DIRECTO','INDIRECTO')),
  position text not null, document text not null unique, active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists favorites (
  user_id uuid not null references app_users(id) on delete cascade, merchant_id uuid not null references merchants(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,merchant_id)
);
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(), order_id uuid not null unique references orders(id),
  customer_id uuid not null references app_users(id), merchant_score integer not null check(merchant_score between 1 and 5),
  courier_score integer not null check(courier_score between 1 and 5), comment text not null default '', created_at timestamptz not null default now()
);
create index if not exists orders_customer_created_idx on orders(customer_id,created_at desc);
create index if not exists orders_merchant_status_idx on orders(merchant_id,status,created_at desc);
create index if not exists products_merchant_active_idx on products(merchant_id,active);
create index if not exists order_events_order_idx on order_events(order_id,created_at);
create index if not exists deliveries_courier_status_idx on deliveries(courier_id,status);

-- API uses the Supabase PostgreSQL connection and enforces ownership and roles in Spring Security.
-- Never expose SUPABASE_DB_PASSWORD or JWT_SECRET to the Vite client.

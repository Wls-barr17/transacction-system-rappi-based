-- Upgrade an existing DomiFlow database created by the earlier schema.sql.
-- Take a Supabase backup before running this migration. This script preserves the
-- application data, moves product stock and courier assignments to normalized
-- tables, then removes those duplicated source columns.

begin;
create extension if not exists pgcrypto;

-- Reference tables required by foreign keys.
create table if not exists roles(code text primary key,name text not null unique,description text not null default '',active boolean not null default true);
insert into roles(code,name,description) values
 ('CLIENTE','Cliente','Compra y seguimiento de pedidos'),('COMERCIO','Comercio','Administra un establecimiento'),
 ('REPARTIDOR','Repartidor','Recoge y entrega pedidos'),('ADMINISTRADOR','Administrador','Administra la plataforma')
on conflict(code) do nothing;

create table if not exists business_categories(code text primary key,name text not null unique,active boolean not null default true,created_at timestamptz not null default now());
update merchants set category='Restaurantes' where category is null or btrim(category)='';
insert into business_categories(code,name)
select distinct category,category from merchants where category is not null and btrim(category)<>''
on conflict(code) do nothing;
insert into business_categories(code,name) values('Restaurantes','Restaurantes'),('Mercado','Mercado'),('Farmacia','Farmacia') on conflict(code) do nothing;

create table if not exists service_areas(code text primary key,name text not null,city text not null default 'Bogotá',department text not null default 'Cundinamarca',active boolean not null default true,unique(name,city));
update merchants set area='Chapinero' where area is null or btrim(area)='';
insert into service_areas(code,name)
select distinct area,area from merchants where area is not null and btrim(area)<>''
on conflict(code) do nothing;
insert into service_areas(code,name) values('Chapinero','Chapinero'),('Usaquén','Usaquén'),('Cedritos','Cedritos') on conflict(code) do nothing;

create table if not exists order_statuses(code text primary key,label text not null unique,sort_order smallint not null unique,terminal boolean not null default false);
insert into order_statuses(code,label,sort_order,terminal) values
 ('PENDIENTE','Pendiente',10,false),('CONFIRMADO','Confirmado',20,false),('EN_PREPARACION','En preparación',30,false),
 ('LISTO_PARA_RECOGER','Listo para recoger',40,false),('EN_CAMINO','En camino',50,false),('ENTREGADO','Entregado',60,true),
 ('CANCELADO','Cancelado',70,true),('RECHAZADO','Rechazado',80,true)
on conflict(code) do nothing;
create table if not exists payment_statuses(code text primary key,label text not null unique,terminal boolean not null default false);
insert into payment_statuses(code,label,terminal) values('PENDIENTE','Pendiente',false),('APROBADO','Aprobado',true),('RECHAZADO','Rechazado',true) on conflict(code) do nothing;
create table if not exists delivery_statuses(code text primary key,label text not null unique,sort_order smallint not null unique,terminal boolean not null default false);
insert into delivery_statuses(code,label,sort_order,terminal) values
 ('PENDIENTE','Pendiente',10,false),('ASIGNADA','Asignada',20,false),('RECOGIDA','Recogida',30,false),
 ('EN_CAMINO','En camino',40,false),('ENTREGADA','Entregada',50,true),('CANCELADA','Cancelada',60,true)
on conflict(code) do nothing;
create table if not exists payment_methods(code text primary key,name text not null unique,active boolean not null default true);
insert into payment_methods(code,name) values('TARJETA','Tarjeta'),('PSE','PSE'),('EFECTIVO','Efectivo') on conflict(code) do nothing;
insert into payment_methods(code,name) select distinct payment_method,payment_method from orders where payment_method is not null on conflict(code) do nothing;
insert into payment_methods(code,name) select distinct method,method from payments where method is not null on conflict(code) do nothing;

-- Normalize business category and area values while retaining their API codes.
insert into business_categories(code,name) select distinct category,category from merchants where category is not null on conflict(code) do nothing;
insert into service_areas(code,name) select distinct area,area from merchants where area is not null on conflict(code) do nothing;

-- Product inventory is separated from product description and price.
create table if not exists product_inventory(
  product_id uuid primary key references products(id) on delete cascade,
  available_quantity integer not null default 0 check(available_quantity>=0),
  updated_at timestamptz not null default now()
);
do $$ begin
  if exists(select 1 from information_schema.columns where table_schema=current_schema() and table_name='products' and column_name='stock') then
    execute 'insert into product_inventory(product_id,available_quantity) select id,stock from products on conflict(product_id) do nothing';
  end if;
end $$;
insert into product_inventory(product_id,available_quantity) select id,0 from products on conflict(product_id) do nothing;

-- Ensure every product category belongs to its product's merchant.
insert into categories(merchant_id,name,active)
select distinct p.merchant_id,coalesce(c.name,'General'),true
from products p left join categories c on c.id=p.category_id
on conflict(merchant_id,name) do nothing;
update products p set category_id=(
  select target.id from categories target
  where target.merchant_id=p.merchant_id
    and target.name=coalesce((select old.name from categories old where old.id=p.category_id),'General')
  limit 1
)
where p.category_id is null or not exists(select 1 from categories c where c.id=p.category_id and c.merchant_id=p.merchant_id);
delete from categories where merchant_id is null;
alter table categories alter column merchant_id set not null;
alter table products alter column category_id set not null;
create unique index if not exists categories_id_merchant_uq on categories(id,merchant_id);
create unique index if not exists products_id_merchant_uq on products(id,merchant_id);
alter table products drop constraint if exists products_category_id_fkey;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='products_category_same_merchant_fk') then
    alter table products add constraint products_category_same_merchant_fk
      foreign key(category_id,merchant_id) references categories(id,merchant_id) on delete restrict;
  end if;
end $$;

-- Transfer courier_id to an auditable assignment history before removing it.
create table if not exists delivery_assignments(
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries(id) on delete cascade,
  courier_id uuid not null references app_users(id) on delete restrict,
  assigned_by uuid references app_users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  note text not null default '',
  check(unassigned_at is null or unassigned_at>=assigned_at)
);
do $$ begin
  if exists(select 1 from information_schema.columns where table_schema=current_schema() and table_name='deliveries' and column_name='courier_id') then
    execute 'insert into delivery_assignments(delivery_id,courier_id,assigned_at) select id,courier_id,created_at from deliveries where courier_id is not null on conflict do nothing';
    alter table deliveries drop column courier_id;
  end if;
end $$;
create unique index if not exists delivery_one_current_courier_uq on delivery_assignments(delivery_id) where unassigned_at is null;
create index if not exists delivery_assignments_courier_idx on delivery_assignments(courier_id,assigned_at desc);

-- New operational and history tables.
create table if not exists customer_profiles(user_id uuid primary key references app_users(id) on delete cascade,marketing_opt_in boolean not null default false,preferred_language text not null default 'es-CO',created_at timestamptz not null default now());
create table if not exists courier_profiles(user_id uuid primary key references app_users(id) on delete cascade,vehicle_type text check(vehicle_type in ('BICICLETA','MOTO','CARRO','OTRO')),vehicle_plate text,verification_status text not null default 'PENDIENTE' check(verification_status in ('PENDIENTE','VERIFICADO','RECHAZADO')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
insert into customer_profiles(user_id) select id from app_users where role='CLIENTE' on conflict(user_id) do nothing;
insert into courier_profiles(user_id) select id from app_users where role='REPARTIDOR' on conflict(user_id) do nothing;
create or replace function ensure_role_profile() returns trigger language plpgsql as $$
begin
  if tg_op='UPDATE' and old.role=new.role then return new; end if;
  if new.role='CLIENTE' then insert into customer_profiles(user_id) values(new.id) on conflict(user_id) do nothing;
  elsif new.role='REPARTIDOR' then insert into courier_profiles(user_id) values(new.id) on conflict(user_id) do nothing;
  end if;
  return new;
end;
$$;
do $$ begin
  if not exists(select 1 from pg_trigger where tgname='app_users_ensure_role_profile' and not tgisinternal) then
    create trigger app_users_ensure_role_profile after insert or update on app_users for each row execute function ensure_role_profile();
  end if;
end $$;
create table if not exists merchant_hours(id uuid primary key default gen_random_uuid(),merchant_id uuid not null references merchants(id) on delete cascade,day_of_week smallint not null check(day_of_week between 0 and 6),opens_at time,closes_at time,closes_next_day boolean not null default false,is_closed boolean not null default false,timezone_name text not null default 'America/Bogota',unique(merchant_id,day_of_week),check(is_closed or (opens_at is not null and closes_at is not null and opens_at<>closes_at)));
alter table merchant_hours add column if not exists closes_next_day boolean not null default false;
alter table merchant_hours add column if not exists timezone_name text not null default 'America/Bogota';
alter table merchant_hours alter column opens_at drop not null;
alter table merchant_hours alter column closes_at drop not null;
create table if not exists carts(id uuid primary key default gen_random_uuid(),user_id uuid not null references app_users(id) on delete cascade,merchant_id uuid references merchants(id) on delete restrict,status text not null default 'ACTIVO' check(status in ('ACTIVO','CONVERTIDO','ABANDONADO')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table carts add column if not exists merchant_id uuid references merchants(id) on delete restrict;
alter table carts add column if not exists updated_at timestamptz not null default now();
create unique index if not exists carts_one_active_per_user_uq on carts(user_id) where status='ACTIVO';
create table if not exists cart_items(id uuid primary key default gen_random_uuid(),cart_id uuid not null references carts(id) on delete cascade,product_id uuid not null references products(id) on delete restrict,merchant_id uuid,quantity integer not null check(quantity between 1 and 100),added_at timestamptz not null default now(),unique(cart_id,product_id));
alter table cart_items add column if not exists merchant_id uuid;
update cart_items ci set merchant_id=p.merchant_id from products p where p.id=ci.product_id and ci.merchant_id is null;
create table if not exists promotions(id uuid primary key default gen_random_uuid(),name text not null,description text not null default '',discount_type text not null check(discount_type in ('PERCENTAGE','FIXED')),discount_value integer not null check(discount_value>0),min_subtotal integer not null default 0 check(min_subtotal>=0),starts_at timestamptz not null,ends_at timestamptz,max_redemptions integer check(max_redemptions is null or max_redemptions>0),active boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(ends_at is null or ends_at>starts_at),check(discount_type<>'PERCENTAGE' or discount_value<=100));
create table if not exists promotion_merchants(promotion_id uuid not null references promotions(id) on delete cascade,merchant_id uuid not null references merchants(id) on delete cascade,primary key(promotion_id,merchant_id));
create table if not exists coupons(id uuid primary key default gen_random_uuid(),code text not null unique check(code=upper(btrim(code))),promotion_id uuid not null references promotions(id) on delete restrict,active boolean not null default true,created_at timestamptz not null default now());
create table if not exists coupon_redemptions(id uuid primary key default gen_random_uuid(),coupon_id uuid not null references coupons(id) on delete restrict,order_id uuid not null unique references orders(id) on delete restrict,user_id uuid not null references app_users(id) on delete restrict,discount_amount integer not null check(discount_amount>=0),redeemed_at timestamptz not null default now());
create unique index if not exists orders_id_customer_uq on orders(id,customer_id);
do $$ begin
  if not exists(select 1 from pg_constraint where conname='ratings_order_customer_fk') then
    alter table ratings add constraint ratings_order_customer_fk foreign key(order_id,customer_id) references orders(id,customer_id) on delete restrict not valid;
  end if;
  if not exists(select 1 from pg_constraint where conname='coupon_redemptions_order_customer_fk') then
    alter table coupon_redemptions add constraint coupon_redemptions_order_customer_fk foreign key(order_id,user_id) references orders(id,customer_id) on delete restrict not valid;
  end if;
  if not exists(select 1 from pg_constraint where conname='orders_total_consistency_ck') then
    alter table orders add constraint orders_total_consistency_ck check(total=subtotal-discount+delivery_fee) not valid;
  end if;
end $$;
create table if not exists stock_movements(id uuid primary key default gen_random_uuid(),product_id uuid not null references products(id) on delete restrict,order_id uuid references orders(id) on delete restrict,changed_by uuid references app_users(id) on delete set null,movement_type text not null check(movement_type in ('RECEPCION','AJUSTE','RESERVA','VENTA','DEVOLUCION')),quantity_delta integer not null check(quantity_delta<>0),note text not null default '',created_at timestamptz not null default now(),unique(order_id,product_id,movement_type));
create table if not exists payment_attempts(id uuid primary key default gen_random_uuid(),order_id uuid not null references orders(id) on delete cascade,attempt_number smallint not null check(attempt_number>0),method text not null references payment_methods(code),amount integer not null check(amount>=0),status text not null references payment_statuses(code),transaction_reference text not null unique,provider_response jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),unique(order_id,attempt_number));
create table if not exists delivery_locations(id bigint generated always as identity primary key,delivery_id uuid not null references deliveries(id) on delete cascade,latitude double precision not null check(latitude between -90 and 90),longitude double precision not null check(longitude between -180 and 180),recorded_at timestamptz not null default now());

-- Additional fields used by the full read model.
alter table app_users add column if not exists avatar_url text not null default '';
alter table merchants add column if not exists image_url text not null default '';
alter table products add column if not exists image_url text not null default '';
alter table addresses add column if not exists neighborhood text not null default '';
alter table addresses add column if not exists postal_code text not null default '';
alter table addresses add column if not exists updated_at timestamptz not null default now();
alter table app_users add column if not exists updated_at timestamptz not null default now();
alter table employees add column if not exists updated_at timestamptz not null default now();
alter table merchants add column if not exists updated_at timestamptz not null default now();
alter table products add column if not exists updated_at timestamptz not null default now();
alter table orders add column if not exists updated_at timestamptz not null default now();
alter table payments add column if not exists updated_at timestamptz not null default now();
alter table deliveries add column if not exists updated_at timestamptz not null default now();
alter table notifications add column if not exists order_id uuid references orders(id) on delete set null;
alter table order_events add column if not exists changed_by uuid references app_users(id) on delete set null;
alter table order_events add column if not exists note text not null default '';
alter table delivery_events add column if not exists changed_by uuid references app_users(id) on delete set null;
alter table delivery_events add column if not exists note text not null default '';
alter table order_items add column if not exists line_total bigint generated always as (price_snapshot::bigint*quantity::bigint) stored;
alter table promotions add column if not exists updated_at timestamptz not null default now();
alter table carts add column if not exists updated_at timestamptz not null default now();

-- Backfill lookup references, then install referential constraints.
create unique index if not exists app_users_email_lower_uq on app_users(lower(email));
do $$ begin
  if not exists(select 1 from pg_constraint where conname='app_users_role_fk') then alter table app_users add constraint app_users_role_fk foreign key(role) references roles(code) on update cascade on delete restrict; end if;
  if not exists(select 1 from pg_constraint where conname='merchants_category_fk') then alter table merchants add constraint merchants_category_fk foreign key(category) references business_categories(code) on update cascade on delete restrict; end if;
  if not exists(select 1 from pg_constraint where conname='merchants_area_fk') then alter table merchants add constraint merchants_area_fk foreign key(area) references service_areas(code) on update cascade on delete restrict; end if;
  if not exists(select 1 from pg_constraint where conname='orders_order_status_fk') then alter table orders add constraint orders_order_status_fk foreign key(status) references order_statuses(code); end if;
  if not exists(select 1 from pg_constraint where conname='orders_payment_status_fk') then alter table orders add constraint orders_payment_status_fk foreign key(payment_status) references payment_statuses(code); end if;
  if not exists(select 1 from pg_constraint where conname='orders_payment_method_fk') then alter table orders add constraint orders_payment_method_fk foreign key(payment_method) references payment_methods(code); end if;
  if not exists(select 1 from pg_constraint where conname='payments_payment_status_fk') then alter table payments add constraint payments_payment_status_fk foreign key(status) references payment_statuses(code); end if;
  if not exists(select 1 from pg_constraint where conname='payments_payment_method_fk') then alter table payments add constraint payments_payment_method_fk foreign key(method) references payment_methods(code); end if;
  if not exists(select 1 from pg_constraint where conname='deliveries_delivery_status_fk') then alter table deliveries add constraint deliveries_delivery_status_fk foreign key(status) references delivery_statuses(code); end if;
  if not exists(select 1 from pg_constraint where conname='order_events_status_fk') then alter table order_events add constraint order_events_status_fk foreign key(status) references order_statuses(code); end if;
  if not exists(select 1 from pg_constraint where conname='delivery_events_status_fk') then alter table delivery_events add constraint delivery_events_status_fk foreign key(status) references delivery_statuses(code); end if;
end $$;

-- Ratings are derived from submitted reviews; merchants has no rating cache column.
create or replace view v_merchant_ratings as
select m.id as merchant_id,
       coalesce(round(avg(r.merchant_score)::numeric,1),0)::numeric(2,1) as rating,
       count(r.id)::bigint as rating_count
from merchants m
left join orders o on o.merchant_id=m.id
left join ratings r on r.order_id=o.id
group by m.id;

create or replace view v_product_catalog as
select p.id,p.merchant_id,p.category_id,p.name,p.description,p.emoji,p.price,p.active,
       coalesce(i.available_quantity,0) as stock,p.image_url
from products p left join product_inventory i on i.product_id=p.id;

create or replace view v_courier_ratings as
select da.courier_id as user_id,round(avg(r.courier_score)::numeric,1)::numeric(2,1) as rating,count(r.id)::bigint as rating_count
from ratings r join deliveries d on d.order_id=r.order_id
join delivery_assignments da on da.delivery_id=d.id and da.unassigned_at is null
group by da.courier_id;

-- Retire duplicate stock only after it has been copied to product_inventory.
alter table products drop column if exists stock;

create or replace function initialize_product_inventory() returns trigger
language plpgsql as $$
begin
  insert into product_inventory(product_id,available_quantity) values(new.id,0)
  on conflict(product_id) do nothing;
  return new;
end;
$$;
do $$ begin
  if not exists(select 1 from pg_trigger where tgname='products_initialize_inventory' and not tgisinternal) then
    create trigger products_initialize_inventory after insert on products for each row execute function initialize_product_inventory();
  end if;
end $$;

create or replace function set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['app_users','employees','courier_profiles','addresses','merchants','products','product_inventory','promotions','carts','orders','payments','deliveries'] loop
    if not exists(select 1 from pg_trigger where tgname=t||'_set_updated_at' and not tgisinternal) then
      execute format('create trigger %I before update on %I for each row execute function set_updated_at()',t||'_set_updated_at',t);
    end if;
  end loop;
end $$;

commit;

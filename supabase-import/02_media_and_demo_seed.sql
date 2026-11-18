-- DomiFlow development seed. All merchants and accounts are fictitious.
-- Demo password for the accounts created below: DomiDemo2026!
-- DO NOT run this seed in production. It creates shared-password demo accounts.
begin;
create extension if not exists pgcrypto;

alter table app_users add column if not exists avatar_url text not null default '';
alter table merchants add column if not exists image_url text not null default '';
alter table products add column if not exists image_url text not null default '';

create temporary table seed_stores(
  code text primary key, name text not null, business_type text not null,
  menu_key text not null, area text not null, delivery_fee integer not null,
  emoji text not null, description text not null, image_url text not null
) on commit drop;
insert into seed_stores values
('R01','Fogón del Barrio · Demo','Restaurantes','CASERA','Chapinero','3500','🍲','Cocina bogotana de demostración','photo-1547592180-85f173990554'),
('R02','Casa Ajiaco · Demo','Restaurantes','CASERA','Usaquén','4000','🥘','Platos caseros preparados al momento','photo-1546069901-ba9599a7e63c'),
('R03','Sazón Capital · Demo','Restaurantes','CASERA','Cedritos','3000','🍛','Sabores colombianos para compartir','photo-1512621776951-a57141f2eefd'),
('R04','Patio Criollo · Demo','Restaurantes','CASERA','Chapinero','3200','🍽️','Menú criollo de demostración','photo-1547592180-85f173990554'),
('R05','Horno de la 85 · Demo','Restaurantes','PIZZA','Chapinero','3500','🍕','Pizza artesanal de demostración','photo-1565299624946-b28f40a0ae38'),
('R06','Masa y Fuego · Demo','Restaurantes','PIZZA','Usaquén','4500','🍕','Pizzas al horno y pastas frescas','photo-1571407970349-bc81e7e96d47'),
('R07','Nona Urbana · Demo','Restaurantes','PIZZA','Cedritos','3000','🍕','Masa artesanal hecha cada día','photo-1574071318508-1cdbab80d002'),
('R08','La Esquina Napolitana · Demo','Restaurantes','PIZZA','Chapinero','3500','🍕','Clásicos italianos de demostración','photo-1604382355076-af4b0eb60143'),
('R09','Sushi Sora · Demo','Restaurantes','SUSHI','Usaquén','4000','🍣','Rolls y nigiris de demostración','photo-1579871494447-9811cf80d66c'),
('R10','Nori y Arroz · Demo','Restaurantes','SUSHI','Chapinero','3500','🍣','Cocina japonesa preparada al momento','photo-1553621042-f6e147245754'),
('R11','Tokyo Caja · Demo','Restaurantes','SUSHI','Cedritos','3000','🍱','Bento y sushi de demostración','photo-1617196034796-73dfa7b1fd56'),
('R12','Roll de Oriente · Demo','Restaurantes','SUSHI','Usaquén','4500','🍱','Rolls frescos para compartir','photo-1579584425555-c3ce17fd4351'),
('R13','Burger Estación · Demo','Restaurantes','BURGER','Chapinero','3000','🍔','Hamburguesas de demostración','photo-1568901346375-23c9450c58cd'),
('R14','Ruta Smash · Demo','Restaurantes','BURGER','Cedritos','3200','🍔','Smash burgers y papas rústicas','photo-1550547660-d9450f859349'),
('R15','Central Burger Club · Demo','Restaurantes','BURGER','Usaquén','4000','🍔','Combos preparados al momento','photo-1571091718767-18b5b1457add'),
('R16','Pan y Parrilla · Demo','Restaurantes','BURGER','Chapinero','3500','🍔','Parrilla urbana de demostración','photo-1561758033-d89a9ad7be15'),
('R17','Taquería del Sol · Demo','Restaurantes','MEXICANA','Cedritos','3000','🌮','Tacos y antojitos de demostración','photo-1552332386-f8dd00dc2f85'),
('R18','Comal Verde · Demo','Restaurantes','MEXICANA','Chapinero','3500','🌯','Cocina mexicana casual','photo-1551504734-5ee1c4a1479b'),
('R19','Calle Limón · Demo','Restaurantes','MEXICANA','Usaquén','4200','🌮','Tacos, burritos y bebidas frescas','photo-1552332386-f8dd00dc2f85'),
('R20','Casa del Maíz · Demo','Restaurantes','MEXICANA','Cedritos','3000','🌽','Sabores mexicanos de demostración','photo-1551504734-5ee1c4a1479b'),
('M01','Mercado Verde Chapinero · Demo','Mercado','MERCADO','Chapinero','3000','🥑','Frutas, despensa y básicos del hogar','photo-1542838132-92c53300491e'),
('M02','Canasta de Usaquén · Demo','Mercado','MERCADO','Usaquén','3500','🧺','Mercado de barrio de demostración','photo-1546173159-315724a31696'),
('M03','Mercadito Cedritos · Demo','Mercado','MERCADO','Cedritos','2800','🍎','Productos frescos y despensa','photo-1490645935967-10de6ba17061'),
('M04','Despensa Urbana · Demo','Mercado','MERCADO','Chapinero','3200','🥖','Básicos para tu cocina','photo-1542838132-92c53300491e'),
('D01','Botica Vecina Chapinero · Demo','Farmacia','DROGUERIA','Chapinero','3000','🩹','Cuidado personal y productos de botiquín','photo-1608248543803-ba4f8c70ae0b'),
('D02','Droguería Buen Día · Demo','Farmacia','DROGUERIA','Usaquén','3500','💊','Droguería de demostración','photo-1556228720-195a672e8a03'),
('D03','Farmacia Cedritos · Demo','Farmacia','DROGUERIA','Cedritos','2800','🧴','Bienestar y cuidado personal','photo-1571781926291-c477ebfd024b'),
('D04','Droguería del Parque · Demo','Farmacia','DROGUERIA','Usaquén','3200','🌡️','Productos básicos de salud y cuidado','photo-1607619056574-7b8d3ee536b2');

create temporary table seed_menus(
  menu_key text primary key, names text[] not null, categories text[] not null,
  prices integer[] not null, emojis text[] not null, images text[] not null
) on commit drop;
insert into seed_menus values
('CASERA',array['Ajiaco bogotano','Bandeja criolla','Pechuga a la plancha','Carne guisada','Sobrebarriga en salsa','Empanadas de la casa','Patacón con hogao','Jugo natural','Limonada de panela','Postre de natas']::text[],array['Platos principales','Platos principales','Platos principales','Platos principales','Platos principales','Entradas','Entradas','Bebidas','Bebidas','Postres']::text[],array[23000,28000,26000,27000,32000,12000,9000,7000,7000,9000]::integer[],array['🍲','🍛','🍗','🥩','🥘','🥟','🍌','🧃','🍋','🍮']::text[],array['https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1513558161293-cb0a0ad7b1d9?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80']::text[]),
('PIZZA',array['Pizza Margarita','Pizza Pepperoni','Pizza Hawaiana','Pizza Cuatro Quesos','Pizza Vegetariana','Lasaña de la casa','Pan de ajo','Ensalada Caprese','Limonada natural','Tiramisú']::text[],array['Pizzas','Pizzas','Pizzas','Pizzas','Pizzas','Pastas','Entradas','Entradas','Bebidas','Postres']::text[],array[24000,28000,27000,32000,26000,22000,8000,14000,8000,12000]::integer[],array['🍕','🍕','🍍','🧀','🥬','🍝','🥖','🥗','🍋','🍰']::text[],array['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1619531040576-f9416740661c?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1513558161293-cb0a0ad7b1d9?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80']::text[]),
('SUSHI',array['Roll California (8 piezas)','Roll Tempura (8 piezas)','Roll Philadelphia','Nigiri de salmón','Nigiri de camarón','Gyozas de cerdo','Edamame','Sopa miso','Té de jazmín','Mochi surtido']::text[],array['Rolls','Rolls','Rolls','Nigiri','Nigiri','Entradas','Entradas','Entradas','Bebidas','Postres']::text[],array[24000,26000,27000,21000,22000,15000,10000,9000,7000,11000]::integer[],array['🍣','🍤','🍣','🍣','🍤','🥟','🫛','🍜','🍵','🍡']::text[],array['https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1563240341-1e6e2f9f3a68?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80']::text[]),
('BURGER',array['Hamburguesa clásica','Doble queso','Tocineta BBQ','Pollo crispy','Veggie burger','Papas rústicas','Aros de cebolla','Malteada de vainilla','Limonada','Brownie tibio']::text[],array['Hamburguesas','Hamburguesas','Hamburguesas','Hamburguesas','Hamburguesas','Acompañamientos','Acompañamientos','Bebidas','Bebidas','Postres']::text[],array[22000,28000,30000,26000,23000,9000,8000,11000,8000,10000]::integer[],array['🍔','🍔','🥓','🍗','🥬','🍟','🧅','🥤','🍋','🍫']::text[],array['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1561758033-d89a9ad7be15?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1513558161293-cb0a0ad7b1d9?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80']::text[]),
('MEXICANA',array['Tacos al pastor','Burrito de pollo','Quesadillas de queso','Nachos con guacamole','Fajitas mixtas','Guacamole de la casa','Elote con limón','Horchata fría','Agua de Jamaica','Churros con azúcar']::text[],array['Tacos','Platos principales','Quesadillas','Entradas','Platos principales','Entradas','Entradas','Bebidas','Bebidas','Postres']::text[],array[24000,22000,20000,16000,29000,9000,9000,8000,7000,10000]::integer[],array['🌮','🌯','🫓','🧀','🌶️','🥑','🌽','🥛','🧃','🍩']::text[],array['https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1513558161293-cb0a0ad7b1d9?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80']::text[]),
('MERCADO',array['Arroz blanco 1 kg','Leche entera 1 L','Huevos AA x 12','Pan tajado','Aceite vegetal 1 L','Manzana roja unidad','Banano unidad','Café molido 250 g','Pasta corta 500 g','Detergente 1 kg']::text[],array['Despensa','Refrigerados','Huevos y lácteos','Panadería','Despensa','Frutas y verduras','Frutas y verduras','Despensa','Despensa','Aseo del hogar']::text[],array[4800,5200,12000,5800,11500,1800,900,16000,4500,9000]::integer[],array['🍚','🥛','🥚','🍞','🫒','🍎','🍌','☕','🍝','🧼']::text[],array['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1563207153-f403bf289096?auto=format&fit=crop&w=900&q=80']::text[]),
('DROGUERIA',array['Acetaminofén 500 mg (caja demo)','Suero oral (unidad demo)','Curitas surtidas','Termómetro digital','Alcohol antiséptico','Jabón antibacterial','Protector solar FPS 50','Crema humectante','Vitamina C (demo)','Tapabocas x 10']::text[],array['Medicamentos OTC demo','Hidratación','Botiquín','Botiquín','Botiquín','Cuidado personal','Cuidado personal','Cuidado personal','Suplementos demo','Protección']::text[],array[6500,4500,9000,22000,8500,6000,42000,16000,12000,7000]::integer[],array['💊','🧃','🩹','🌡️','🧴','🧼','☀️','🧴','🍊','😷']::text[],array['https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=900&q=80']::text[]);

-- Demo login users. The profile trigger creates customer/courier profile rows.
with demo_users(seed_code,name,email,role,phone,available) as (
  values
    ('admin','Admin DomiFlow Demo','admin.demo@domiflow.test','ADMINISTRADOR','3000000001',false),
    ('cliente','Cliente DomiFlow Demo','cliente.demo@domiflow.test','CLIENTE','3000000002',false),
    ('domiciliario','Domiciliario Demo','domiciliario.demo@domiflow.test','REPARTIDOR','3000000003',true)
  union all
  select 'owner-'||code,'Propietario '||name,'comercio.'||lower(code)||'@domiflow.test','COMERCIO','3000000100',false
  from seed_stores
)
insert into app_users(id,role,name,email,phone,password_hash,active,available)
select md5('domiflow-seed-user:'||seed_code)::uuid,role,name,email,phone,
       crypt('DomiDemo2026!',gen_salt('bf',10)),true,available
from demo_users
on conflict(id) do update set role=excluded.role,name=excluded.name,email=excluded.email,
  phone=excluded.phone,password_hash=excluded.password_hash,active=true,available=excluded.available;

-- Required employee cards for the sample courier.
insert into employees(user_id,name,type,position,document,active)
select id,name,'INDIRECTO','Domiciliario','DEMO-'||replace(id::text,'-',''),true
from app_users where email='domiciliario.demo@domiflow.test'
on conflict(document) do update set active=true,name=excluded.name;

insert into merchants(id,owner_id,category,area,name,description,emoji,image_url,contact,open,active,delivery_fee)
select md5('domiflow-seed-merchant:'||s.code)::uuid,
       md5('domiflow-seed-user:owner-'||s.code)::uuid,
       s.business_type,s.area,s.name,s.description,s.emoji,s.image_url,
       '3000000100',true,true,s.delivery_fee
from seed_stores s
on conflict(id) do update set category=excluded.category,area=excluded.area,name=excluded.name,
  description=excluded.description,emoji=excluded.emoji,image_url=excluded.image_url,
  open=true,active=true,delivery_fee=excluded.delivery_fee;

insert into merchant_hours(merchant_id,day_of_week,opens_at,closes_at,is_closed,timezone_name)
select md5('domiflow-seed-merchant:'||s.code)::uuid,d,'10:00'::time,
       case when s.business_type='Farmacia' then '23:00'::time else '22:00'::time end,
       false,'America/Bogota'
from seed_stores s cross join generate_series(0,6) d
on conflict(merchant_id,day_of_week) do update set opens_at=excluded.opens_at,
  closes_at=excluded.closes_at,is_closed=false,timezone_name=excluded.timezone_name;

insert into categories(merchant_id,name,active)
select distinct md5('domiflow-seed-merchant:'||s.code)::uuid,m.categories[i],true
from seed_stores s join seed_menus m on m.menu_key=s.menu_key
cross join generate_series(1,10) i
on conflict(merchant_id,name) do update set active=true;

insert into products(id,merchant_id,category_id,name,description,price,emoji,image_url,active)
select md5('domiflow-seed-product:'||s.code||':'||i)::uuid,
       md5('domiflow-seed-merchant:'||s.code)::uuid,c.id,m.names[i],
       'Producto ficticio de demostración preparado o seleccionado para el catálogo.',
       greatest(500,m.prices[i]+((ascii(right(s.code,1))%4)*250)),
       m.emojis[i],m.images[i],true
from seed_stores s join seed_menus m on m.menu_key=s.menu_key
cross join generate_series(1,10) i
join categories c on c.merchant_id=md5('domiflow-seed-merchant:'||s.code)::uuid and c.name=m.categories[i]
on conflict(id) do update set category_id=excluded.category_id,name=excluded.name,
  description=excluded.description,price=excluded.price,emoji=excluded.emoji,
  image_url=excluded.image_url,active=true;

insert into product_inventory(product_id,available_quantity)
select id,18+(row_number() over(order by id)::integer%18)
from products
where id in (select md5('domiflow-seed-product:'||s.code||':'||i)::uuid
             from seed_stores s cross join generate_series(1,10) i)
on conflict(product_id) do update set available_quantity=excluded.available_quantity,updated_at=now();

-- Live demo offers and codes, available for one year from execution.
insert into promotions(id,name,description,discount_type,discount_value,min_subtotal,
                       starts_at,ends_at,max_redemptions,active)
values
 ('29000000-0000-4000-8000-000000000001','Bienvenida DomiFlow','10% de descuento de demostración','PERCENTAGE',10,0,now()-interval '1 day',now()+interval '365 days',500,true),
 ('29000000-0000-4000-8000-000000000002','Mercado de barrio','Descuento de $5.000 en compras de mercado','FIXED',5000,25000,now()-interval '1 day',now()+interval '365 days',300,true),
 (md5('domiflow-promo-drogueria')::uuid,'Cuidado de barrio','8% de descuento en droguerías demo','PERCENTAGE',8,15000,now()-interval '1 day',now()+interval '365 days',300,true),
 (md5('domiflow-promo-pizza')::uuid,'Noche de pizza','15% de descuento en pizzerías demo','PERCENTAGE',15,30000,now()-interval '1 day',now()+interval '365 days',200,true),
 (md5('domiflow-promo-envio')::uuid,'Ahorro en tu pedido','$5.000 de descuento en compras desde $35.000','FIXED',5000,35000,now()-interval '1 day',now()+interval '365 days',500,true)
on conflict(id) do update set name=excluded.name,description=excluded.description,
  discount_type=excluded.discount_type,discount_value=excluded.discount_value,
  min_subtotal=excluded.min_subtotal,starts_at=excluded.starts_at,ends_at=excluded.ends_at,
  max_redemptions=excluded.max_redemptions,active=true;

insert into coupons(id,code,promotion_id,active)
values
 ('29000000-0000-4000-8000-000000000011','BIENVENIDO10','29000000-0000-4000-8000-000000000001',true),
 ('29000000-0000-4000-8000-000000000012','MERCADO5000','29000000-0000-4000-8000-000000000002',true),
 (md5('domiflow-coupon-drogueria')::uuid,'BOTIQUIN8',md5('domiflow-promo-drogueria')::uuid,true),
 (md5('domiflow-coupon-pizza')::uuid,'PIZZA15',md5('domiflow-promo-pizza')::uuid,true),
 (md5('domiflow-coupon-envio')::uuid,'AHORRO5000',md5('domiflow-promo-envio')::uuid,true)
-- The seed uses stable UUIDs, so reruns update those rows in place.
on conflict(id) do update set code=excluded.code,
  promotion_id=excluded.promotion_id,active=true;

insert into promotion_merchants(promotion_id,merchant_id)
select md5('domiflow-promo-drogueria')::uuid,md5('domiflow-seed-merchant:'||code)::uuid
from seed_stores where business_type='Farmacia'
on conflict do nothing;
insert into promotion_merchants(promotion_id,merchant_id)
select md5('domiflow-promo-pizza')::uuid,md5('domiflow-seed-merchant:'||code)::uuid
from seed_stores where menu_key='PIZZA'
on conflict do nothing;

-- Default delivery address for the sample customer so checkout works immediately.
insert into addresses(id,user_id,label,street,city,neighborhood,notes,latitude,longitude,is_default)
values(md5('domiflow-seed-address:cliente')::uuid,
       md5('domiflow-seed-user:cliente')::uuid,'Casa demo',
       'Carrera 13 # 72-18','Bogotá','Chapinero','Datos de prueba, ajusta antes de pedir',
       4.6584,-74.0621,true)
on conflict(id) do update set street=excluded.street,city=excluded.city,
  neighborhood=excluded.neighborhood,notes=excluded.notes,latitude=excluded.latitude,
  longitude=excluded.longitude,is_default=true;

commit;


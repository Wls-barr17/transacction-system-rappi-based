package co.domiflow.api;

import static co.domiflow.api.ApiErrors.ApiException;
import co.domiflow.api.security.UserPrincipal;
import co.domiflow.api.service.OrderService;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class MarketplaceController {
  private final JdbcTemplate db; private final PasswordEncoder passwords; private final OrderService orders;
  public MarketplaceController(JdbcTemplate db, PasswordEncoder passwords, OrderService orders) { this.db=db; this.passwords=passwords; this.orders=orders; }

  private ApiException error(HttpStatus status, String text) { return new ApiException(status,text); }
  private Map<String,Object> user(UUID id) { return db.queryForMap("select id, name, email, phone, role, available, active, created_at as \"createdAt\" from app_users where id=?",id); }
  private UserPrincipal principal(org.springframework.security.core.Authentication a) { return (UserPrincipal)a.getPrincipal(); }
  private void role(UserPrincipal p, String... roles) { if (Arrays.stream(roles).noneMatch(p.role()::equals)) throw error(HttpStatus.FORBIDDEN,"No tienes permisos para esta acción"); }
  private Map<String,Object> map(Object... pairs) { Map<String,Object> m=new LinkedHashMap<>(); for(int i=0;i<pairs.length;i+=2)m.put((String)pairs[i],pairs[i+1]); return m; }
  private void notifyUser(UUID userId, String message) { db.update("insert into notifications(user_id,text) values(?,?)",userId,message); }

  @GetMapping("/admin/stats") public Map<String,Object> adminStats(org.springframework.security.core.Authentication a) {
    role(principal(a),"ADMINISTRADOR"); return db.queryForMap("select (select count(*) from app_users) as users,(select count(*) from merchants where active) as merchants,(select count(*) from orders) as orders,(select coalesce(sum(total),0) from orders where status='ENTREGADO') as revenue,(select count(*) from deliveries where status in ('ASIGNADA','RECOGIDA','EN_CAMINO')) as \"activeDeliveries\",(select count(*) from deliveries where status='PENDIENTE') as \"pendingDeliveries\"");
  }

  @GetMapping("/admin/payments") public List<Map<String,Object>> adminPayments(org.springframework.security.core.Authentication a) {
    role(principal(a),"ADMINISTRADOR");
    return db.queryForList("select pa.id,pa.order_id as \"orderId\",o.code as \"orderCode\",u.name as \"customerName\",m.name as \"merchantName\",pa.method,pa.amount,pa.status,pa.transaction_reference as \"transactionReference\",pa.created_at as \"createdAt\",pa.attempt_number as \"attemptNumber\" from payment_attempts pa join orders o on o.id=pa.order_id join app_users u on u.id=o.customer_id join merchants m on m.id=o.merchant_id order by pa.created_at desc limit 100");
  }

  @GetMapping("/admin/users") public List<Map<String,Object>> adminUsers(org.springframework.security.core.Authentication a) { role(principal(a),"ADMINISTRADOR");return db.queryForList("select id,name,email,phone,role,active,available,created_at as \"createdAt\" from app_users order by created_at desc"); }
  @PostMapping("/admin/users") @Transactional public Map<String,Object> addUser(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> b) { role(principal(a),"ADMINISTRADOR");String r=Objects.toString(b.get("role"));if(!List.of("CLIENTE","COMERCIO","REPARTIDOR","ADMINISTRADOR").contains(r))throw error(HttpStatus.BAD_REQUEST,"Rol no válido");UUID id=UUID.randomUUID();String name=Objects.toString(b.get("name"));db.update("insert into app_users(id,name,email,phone,password_hash,role) values(?,?,?,?,?,?)",id,name,Objects.toString(b.get("email")).toLowerCase(),Objects.toString(b.get("phone"),""),passwords.encode(Objects.toString(b.get("password"))),r);if(r.equals("REPARTIDOR"))db.update("insert into employees(user_id,name,type,position,document) values(?,?,'INDIRECTO','Repartidor',?)",id,name,"USR-"+id);return user(id); }
  @PatchMapping("/admin/users/{id}/role") @Transactional public Map<String,Object> setRole(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) { UserPrincipal me=principal(a);role(me,"ADMINISTRADOR");if(me.id().equals(id))throw error(HttpStatus.CONFLICT,"No puedes cambiar tu propio rol");String r=Objects.toString(b.get("role"));if(!List.of("CLIENTE","COMERCIO","REPARTIDOR","ADMINISTRADOR").contains(r))throw error(HttpStatus.BAD_REQUEST,"Rol no válido");db.update("update app_users set role=? where id=?",r,id);if(r.equals("REPARTIDOR"))db.update("insert into employees(user_id,name,type,position,document) select id,name,'INDIRECTO','Repartidor','USR-'||id from app_users where id=? on conflict(user_id) do update set active=true",id);else db.update("update employees set active=false where user_id=?",id);return user(id); }
  @PatchMapping("/admin/users/{id}/active") public Map<String,Object> setUserActive(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) { role(principal(a),"ADMINISTRADOR");db.update("update app_users set active=? where id=?",Boolean.TRUE.equals(b.get("active")),id);return user(id); }
  @GetMapping("/admin/employees") public List<Map<String,Object>> employees(org.springframework.security.core.Authentication a) { role(principal(a),"ADMINISTRADOR");return db.queryForList("select id,name,type,position,document,active,created_at as \"createdAt\" from employees order by created_at desc"); }
  @PostMapping("/admin/employees") public Map<String,Object> addEmployee(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> b) { role(principal(a),"ADMINISTRADOR");UUID id=UUID.randomUUID();db.update("insert into employees(id,name,type,position,document) values(?,?,?,?,?)",id,b.get("name"),b.get("type"),b.get("position"),b.get("document"));return db.queryForMap("select id,name,type,position,document,active,created_at as \"createdAt\" from employees where id=?",id); }
  @PutMapping("/admin/employees/{id}") public Map<String,Object> editEmployee(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) { role(principal(a),"ADMINISTRADOR");int n=db.update("update employees set name=?,type=?,position=?,document=? where id=?",b.get("name"),b.get("type"),b.get("position"),b.get("document"),id);if(n==0)throw error(HttpStatus.NOT_FOUND,"Empleado no encontrado");return db.queryForMap("select id,name,type,position,document,active,created_at as \"createdAt\" from employees where id=?",id); }
  @PatchMapping("/admin/employees/{id}/active") public Map<String,Object> setEmployeeActive(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) { role(principal(a),"ADMINISTRADOR");int n=db.update("update employees set active=? where id=?",Boolean.TRUE.equals(b.get("active")),id);if(n==0)throw error(HttpStatus.NOT_FOUND,"Empleado no encontrado");return db.queryForMap("select id,name,type,position,document,active,created_at as \"createdAt\" from employees where id=?",id); }
  @DeleteMapping("/admin/employees/{id}") public Map<String,Object> removeEmployee(org.springframework.security.core.Authentication a,@PathVariable UUID id) { role(principal(a),"ADMINISTRADOR");db.update("delete from employees where id=?",id);return map("ok",true); }
  @GetMapping("/admin/merchants") public List<Map<String,Object>> adminMerchants(org.springframework.security.core.Authentication a) { role(principal(a),"ADMINISTRADOR");return db.queryForList("select m.id,m.owner_id as \"ownerId\",m.name,m.category,m.emoji,m.image_url as \"imageUrl\",m.description,m.open,m.active,m.delivery_fee as \"deliveryFee\",vr.rating,m.area,u.name as \"ownerName\",u.email as \"ownerEmail\" from merchants m join app_users u on u.id=m.owner_id left join v_merchant_ratings vr on vr.merchant_id=m.id order by m.created_at desc"); }
  @PostMapping("/admin/merchants") @Transactional public Map<String,Object> addMerchant(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> b) { role(principal(a),"ADMINISTRADOR");String email=Objects.toString(b.get("ownerEmail")).toLowerCase();if(db.queryForObject("select count(*) from app_users where lower(email)=?",Integer.class,email)>0)throw error(HttpStatus.CONFLICT,"El correo del propietario ya está registrado");String category=Objects.toString(b.get("category"),"").trim();if(category.isBlank())throw error(HttpStatus.BAD_REQUEST,"Selecciona la categoría del comercio");db.update("insert into business_categories(code,name) values(?,?) on conflict(code) do nothing",category,category);UUID owner=UUID.randomUUID(),merchant=UUID.randomUUID();db.update("insert into app_users(id,name,email,password_hash,role) values(?,?,?,?, 'COMERCIO')",owner,b.get("ownerName"),email,passwords.encode(Objects.toString(b.get("ownerPassword"))));db.update("insert into merchants(id,owner_id,name,category,emoji,image_url,description,delivery_fee,open) values(?,?,?,?,?,?,?,?,false)",merchant,owner,b.get("name"),category,Objects.toString(b.get("emoji"),"🍽️"),imageUrl(b.get("imageUrl")),Objects.toString(b.get("description"),""),Integer.parseInt(Objects.toString(b.get("deliveryFee"),"3000")));return db.queryForMap("select m.id,m.owner_id as \"ownerId\",m.name,m.category,m.emoji,m.image_url as \"imageUrl\",m.description,m.open,m.active,m.delivery_fee as \"deliveryFee\",vr.rating,m.area,u.name as \"ownerName\",u.email as \"ownerEmail\" from merchants m join app_users u on u.id=m.owner_id left join v_merchant_ratings vr on vr.merchant_id=m.id where m.id=?",merchant); }
  @PatchMapping("/admin/merchants/{id}/active") public Map<String,Object> setMerchantActive(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) { role(principal(a),"ADMINISTRADOR");int n=db.update("update merchants set active=? where id=?",Boolean.TRUE.equals(b.get("active")),id);if(n==0)throw error(HttpStatus.NOT_FOUND,"Comercio no encontrado");return db.queryForMap("select id,name,category,active,open,delivery_fee as \"deliveryFee\" from merchants where id=?",id); }
  @GetMapping("/admin/couriers") public List<Map<String,Object>> couriers(org.springframework.security.core.Authentication a) { role(principal(a),"ADMINISTRADOR");return db.queryForList("select id,name,email,phone,role,available,active,created_at as \"createdAt\" from app_users where role='REPARTIDOR' order by name"); }
  @GetMapping("/admin/deliveries") public List<Map<String,Object>> allDeliveries(org.springframework.security.core.Authentication a) {
    role(principal(a),"ADMINISTRADOR");
    return db.queryForList("select id from deliveries order by created_at desc").stream().map(row->delivery((UUID)row.get("id"))).toList();
  }
  @PostMapping("/admin/deliveries/{id}/assign") @Transactional public Map<String,Object> assignDelivery(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) {
    UserPrincipal admin=principal(a);role(admin,"ADMINISTRADOR");
    UUID courier;
    try { courier=UUID.fromString(Objects.toString(b.get("courierId"),"")); }
    catch(IllegalArgumentException e) { throw error(HttpStatus.BAD_REQUEST,"Repartidor no válido"); }
    if(!db.queryForObject("select count(*) from app_users where id=? and role='REPARTIDOR' and active=true",Integer.class,courier).equals(1))throw error(HttpStatus.NOT_FOUND,"Repartidor no encontrado");
    List<String> current=db.queryForList("select status from deliveries where id=? for update",String.class,id);
    if(current.isEmpty()||!List.of("PENDIENTE","ASIGNADA").contains(current.get(0)))throw error(HttpStatus.CONFLICT,"Ya no se puede asignar esta entrega");
    db.update("update delivery_assignments set unassigned_at=now() where delivery_id=? and unassigned_at is null",id);
    db.update("insert into delivery_assignments(delivery_id,courier_id,assigned_by) values(?,?,?)",id,courier,admin.id());
    db.update("update deliveries set status='ASIGNADA' where id=?",id);
    db.update("insert into delivery_events(delivery_id,status,changed_by) values(?,'ASIGNADA',?)",id,admin.id());
    return delivery(id);
  }

  private Map<String,Object> delivery(UUID id) {
    Map<String,Object> d=db.queryForMap("select d.id,d.order_id as \"orderId\",da.courier_id as \"courierId\",d.status from deliveries d left join delivery_assignments da on da.delivery_id=d.id and da.unassigned_at is null where d.id=?",id);
    d.put("history",db.queryForList("select status,created_at as at from delivery_events where delivery_id=? order by created_at",id));
    Map<String,Object> order=orders.getForOperations((UUID)d.get("orderId"));
    d.put("courierName",order.get("courierName"));
    d.put("order",order);
    return d;
  }
  @GetMapping("/deliveries") public Map<String,Object> deliveries(org.springframework.security.core.Authentication a) {
    UserPrincipal p=principal(a);role(p,"REPARTIDOR");boolean available=db.queryForObject("select available from app_users where id=?",Boolean.class,p.id());
    List<UUID> mine=db.queryForList("select d.id from deliveries d join delivery_assignments da on da.delivery_id=d.id and da.unassigned_at is null where da.courier_id=? order by d.created_at desc",UUID.class,p.id());
    List<UUID> open=available?db.queryForList("select d.id from deliveries d where d.status='PENDIENTE' and not exists(select 1 from delivery_assignments da where da.delivery_id=d.id and da.unassigned_at is null) order by d.created_at",UUID.class):List.of();
    return map("mine",mine.stream().map(this::delivery).toList(),"available",open.stream().map(this::delivery).toList());
  }
  @PatchMapping("/courier/availability") public Map<String,Object> availability(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> b) { UserPrincipal p=principal(a);role(p,"REPARTIDOR");db.update("update app_users set available=? where id=?",Boolean.TRUE.equals(b.get("available")),p.id());return user(p.id()); }
  @PostMapping("/deliveries/{id}/take") @Transactional public Map<String,Object> takeDelivery(org.springframework.security.core.Authentication a,@PathVariable UUID id) {
    UserPrincipal p=principal(a);role(p,"REPARTIDOR");if(!db.queryForObject("select available from app_users where id=?",Boolean.class,p.id()))throw error(HttpStatus.CONFLICT,"Activa tu disponibilidad para tomar entregas");
    List<UUID> eligible=db.queryForList("select d.id from deliveries d where d.id=? and d.status='PENDIENTE' and not exists(select 1 from delivery_assignments da where da.delivery_id=d.id and da.unassigned_at is null) for update of d",UUID.class,id);
    if(eligible.isEmpty())throw error(HttpStatus.CONFLICT,"Otra persona ya tomó esta entrega");
    db.update("insert into delivery_assignments(delivery_id,courier_id) values(?,?)",id,p.id());
    db.update("update deliveries set status='ASIGNADA' where id=?",id);
    db.update("insert into delivery_events(delivery_id,status,changed_by) values(?,'ASIGNADA',?)",id,p.id());
    UUID customer=db.queryForObject("select customer_id from orders o join deliveries d on d.order_id=o.id where d.id=?",UUID.class,id);notifyUser(customer,"Un repartidor tomó tu pedido");return delivery(id);
  }
  @PatchMapping("/deliveries/{id}/status") @Transactional public Map<String,Object> updateDelivery(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) {
    UserPrincipal p=principal(a);role(p,"REPARTIDOR","ADMINISTRADOR");String next=Objects.toString(b.get("status"));Map<String,Object>d=db.queryForMap("select d.order_id,da.courier_id,d.status from deliveries d left join delivery_assignments da on da.delivery_id=d.id and da.unassigned_at is null where d.id=? for update of d",id);
    if(p.role().equals("REPARTIDOR")&&!p.id().equals(d.get("courier_id")))throw error(HttpStatus.FORBIDDEN,"Esta entrega no es tuya");String before=(String)d.get("status");Map<String,List<String>> flow=Map.of("ASIGNADA",List.of("RECOGIDA","CANCELADA"),"RECOGIDA",List.of("EN_CAMINO","CANCELADA"),"EN_CAMINO",List.of("ENTREGADA","CANCELADA"));if(!flow.getOrDefault(before,List.of()).contains(next))throw error(HttpStatus.CONFLICT,"Transición de entrega inválida");
    UUID oid=(UUID)d.get("order_id");Map<String,Object> o=db.queryForMap("select status from orders where id=?",oid);if(next.equals("RECOGIDA")&&!o.get("status").equals("LISTO_PARA_RECOGER"))throw error(HttpStatus.CONFLICT,"El comercio aún no marca el pedido como listo para recoger");
    db.update("update deliveries set status=? where id=?",next,id);db.update("insert into delivery_events(delivery_id,status,changed_by) values(?,?,?)",id,next,p.id());String os=switch(next){case "EN_CAMINO"->"EN_CAMINO";case "ENTREGADA"->"ENTREGADO";case "CANCELADA"->"CANCELADO";default->null;};if(os!=null){db.update("update orders set status=? where id=?",os,oid);db.update("insert into order_events(order_id,status,changed_by) values(?,?,?)",oid,os,p.id());if(os.equals("CANCELADO")){db.update("update product_inventory inventory set available_quantity=inventory.available_quantity+items.quantity from order_items items where items.order_id=? and items.product_id=inventory.product_id",oid);db.update("insert into stock_movements(product_id,order_id,changed_by,movement_type,quantity_delta,note) select product_id,order_id,?,'DEVOLUCION',quantity,'Reintegro por cancelación de entrega' from order_items where order_id=? on conflict(order_id,product_id,movement_type) do nothing",p.id(),oid);}notifyUser((UUID)db.queryForObject("select customer_id from orders where id=?",UUID.class,oid),"Tu pedido ahora está: "+os.toLowerCase(Locale.ROOT).replace('_',' '));}return delivery(id);
  }
  @GetMapping("/notifications") public List<Map<String,Object>> notifications(org.springframework.security.core.Authentication a) { return db.queryForList("select id,user_id as \"userId\",text,read,created_at as \"createdAt\" from notifications where user_id=? order by created_at desc limit 50",principal(a).id()); }
  @PatchMapping("/notifications/read-all") public Map<String,Object> readNotifications(org.springframework.security.core.Authentication a) { db.update("update notifications set read=true where user_id=?",principal(a).id());return map("ok",true); }
  @PatchMapping("/notifications/{id}/read") public Map<String,Object> readNotification(org.springframework.security.core.Authentication a,@PathVariable UUID id) { db.update("update notifications set read=true where id=? and user_id=?",id,principal(a).id());return map("ok",true); }

  private UUID ownMerchant(UserPrincipal p) { role(p,"COMERCIO"); return db.queryForObject("select id from merchants where owner_id=?",UUID.class,p.id()); }
  @GetMapping("/my/merchant") public Map<String,Object> myMerchant(org.springframework.security.core.Authentication a) {
    UUID id=ownMerchant(principal(a));
    Map<String,Object> merchant=db.queryForMap("select m.id,m.owner_id as \"ownerId\",m.name,m.category,m.emoji,m.image_url as \"imageUrl\",m.description,m.open,m.delivery_fee as \"deliveryFee\",coalesce(r.rating,0) as rating,m.area from merchants m left join v_merchant_ratings r on r.merchant_id=m.id where m.id=?",id);
    merchant.put("categories",db.queryForList("select name from categories where merchant_id=? and active=true order by name",id).stream().map(row->row.get("name")).toList());
    return merchant;
  }
  @PatchMapping("/my/merchant") public Map<String,Object> setMerchantAvailability(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> b) {
    UUID id=ownMerchant(principal(a));
    db.update("update merchants set open=? where id=?",Boolean.TRUE.equals(b.get("open")),id);
    return myMerchant(a);
  }
  @GetMapping("/my/products") public List<Map<String,Object>> myProducts(org.springframework.security.core.Authentication a) {
    return db.queryForList("select p.id,p.merchant_id as \"merchantId\",p.name,p.description,p.price,p.emoji,p.image_url as \"imageUrl\",coalesce(i.available_quantity,0) as stock,p.active,c.name as category from products p join categories c on c.id=p.category_id left join product_inventory i on i.product_id=p.id where p.merchant_id=? order by p.name",ownMerchant(principal(a)));
  }
  @PostMapping("/my/products") @Transactional public Map<String,Object> createProduct(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> b) {
    UserPrincipal actor=principal(a);UUID merchant=ownMerchant(actor);String categoryName=Objects.toString(b.get("category"),"General");UUID categoryId=category(merchant,categoryName);UUID id=UUID.randomUUID();
    int stock=Integer.parseInt(Objects.toString(b.get("stock"),"0"));
    if(stock<0)throw error(HttpStatus.BAD_REQUEST,"El stock no puede ser negativo");
    db.update("insert into products(id,merchant_id,category_id,name,description,price,emoji,image_url,active) values(?,?,?,?,?,?,?,?,?)",id,merchant,categoryId,b.get("name"),Objects.toString(b.get("description"),""),Integer.parseInt(b.get("price").toString()),Objects.toString(b.get("emoji"),"🍽️"),imageUrl(b.get("imageUrl")),!Boolean.FALSE.equals(b.get("active")));
    db.update("update product_inventory set available_quantity=? where product_id=?",stock,id);
    if(stock>0)db.update("insert into stock_movements(product_id,changed_by,movement_type,quantity_delta,note) values(?,?,'AJUSTE',?,'Existencia inicial del producto')",id,actor.id(),stock);
    return myProductsFor(merchant,id);
  }
  @PutMapping("/my/products/{id}") @Transactional public Map<String,Object> editProduct(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) {
    UserPrincipal actor=principal(a);UUID merchant=ownMerchant(actor);UUID cat=category(merchant,Objects.toString(b.get("category"),"General"));
    int newStock=Integer.parseInt(Objects.toString(b.get("stock"),"0"));if(newStock<0)throw error(HttpStatus.BAD_REQUEST,"El stock no puede ser negativo");
    int n=db.update("update products set name=?,description=?,price=?,category_id=?,emoji=?,image_url=?,active=? where id=? and merchant_id=?",b.get("name"),Objects.toString(b.get("description"),""),Integer.parseInt(b.get("price").toString()),cat,Objects.toString(b.get("emoji"),"🍽️"),imageUrl(b.get("imageUrl")),!Boolean.FALSE.equals(b.get("active")),id,merchant);
    if(n==0)throw error(HttpStatus.NOT_FOUND,"Producto no encontrado");
    adjustInventory(actor,merchant,id,newStock,"Ajuste desde edición de producto");
    return myProductsFor(merchant,id);
  }
  @DeleteMapping("/my/products/{id}") public Map<String,Object> deleteProduct(org.springframework.security.core.Authentication a,@PathVariable UUID id) { int n=db.update("update products set active=false where id=? and merchant_id=?",id,ownMerchant(principal(a)));if(n==0)throw error(HttpStatus.NOT_FOUND,"Producto no encontrado");return map("ok",true); }
  @PatchMapping("/my/products/{id}/stock") @Transactional public Map<String,Object> setStock(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) {
    UserPrincipal actor=principal(a);UUID merchant=ownMerchant(actor);int stock=Integer.parseInt(Objects.toString(b.get("stock"),"-1"));
    if(stock<0)throw error(HttpStatus.BAD_REQUEST,"El stock no puede ser negativo");
    adjustInventory(actor,merchant,id,stock,"Ajuste manual de inventario");
    return myProductsFor(merchant,id);
  }
  @PostMapping("/my/categories") public Map<String,Object> addCategory(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> b) { UUID merchant=ownMerchant(principal(a));String name=Objects.toString(b.get("name"),"").trim();if(name.isBlank())throw error(HttpStatus.BAD_REQUEST,"Escribe el nombre de la categoría");if(db.queryForObject("select count(*) from categories where merchant_id=? and lower(name)=lower(?) and active",Integer.class,merchant,name)>0)throw error(HttpStatus.CONFLICT,"Esa categoría ya existe");category(merchant,name);return myMerchant(a); }
  @DeleteMapping("/my/categories/{name}") public Map<String,Object> removeCategory(org.springframework.security.core.Authentication a,@PathVariable String name) { UUID merchant=ownMerchant(principal(a));List<UUID> ids=db.query("select id from categories where merchant_id=? and name=? and active",(rs,n)->rs.getObject("id",UUID.class),merchant,name);if(ids.isEmpty())throw error(HttpStatus.NOT_FOUND,"Categoría no encontrada");UUID id=ids.get(0);if(db.queryForObject("select count(*) from products where category_id=? and active",Integer.class,id)>0)throw error(HttpStatus.CONFLICT,"No puedes borrar una categoría con productos activos");db.update("update categories set active=false where id=?",id);return myMerchant(a); }
  private UUID category(UUID merchant,String name) { return db.queryForObject("insert into categories(merchant_id,name) values(?,?) on conflict(merchant_id,name) do update set active=true returning id",UUID.class,merchant,name); }
  private void adjustInventory(UserPrincipal actor,UUID merchantId,UUID productId,int newStock,String note) {
    List<Integer> current=db.queryForList("select i.available_quantity from product_inventory i join products p on p.id=i.product_id where p.merchant_id=? and p.id=? for update of i",Integer.class,merchantId,productId);
    if(current.isEmpty())throw error(HttpStatus.NOT_FOUND,"Producto no encontrado");
    int delta=newStock-current.get(0);
    if(delta==0)return;
    db.update("update product_inventory set available_quantity=? where product_id=?",newStock,productId);
    db.update("insert into stock_movements(product_id,changed_by,movement_type,quantity_delta,note) values(?,?,'AJUSTE',?,?)",productId,actor.id(),delta,note);
  }
  private Map<String,Object> myProductsFor(UUID merchant,UUID id) { return db.queryForMap("select p.id,p.merchant_id as \"merchantId\",p.name,p.description,p.price,p.emoji,p.image_url as \"imageUrl\",coalesce(i.available_quantity,0) as stock,p.active,c.name as category from products p join categories c on c.id=p.category_id left join product_inventory i on i.product_id=p.id where p.merchant_id=? and p.id=?",merchant,id); }
  private String imageUrl(Object value) { String url=Objects.toString(value,"").trim(); if(!url.isEmpty()&&(!url.startsWith("https://")||url.length()>2048))throw error(HttpStatus.BAD_REQUEST,"La foto debe usar una URL HTTPS válida"); return url; }
}

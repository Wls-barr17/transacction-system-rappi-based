package co.domiflow.api;

import static co.domiflow.api.ApiErrors.ApiException;
import co.domiflow.api.security.JwtService;
import co.domiflow.api.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class MarketplaceController {
  private final JdbcTemplate db; private final PasswordEncoder passwords; private final JwtService jwt;
  public MarketplaceController(JdbcTemplate db, PasswordEncoder passwords, JwtService jwt) { this.db=db; this.passwords=passwords; this.jwt=jwt; }

  public record Register(@NotBlank @Size(max=120) String name, @NotBlank @Email String email, @NotBlank @Size(min=8) String password, String phone) {}
  public record Login(@NotBlank @Email String email, @NotBlank String password) {}
  private ApiException error(HttpStatus status, String text) { return new ApiException(status,text); }
  private Map<String,Object> user(UUID id) { return db.queryForMap("select id, name, email, phone, role, available, active, created_at as \"createdAt\" from app_users where id=?",id); }
  private UserPrincipal principal(org.springframework.security.core.Authentication a) { return (UserPrincipal)a.getPrincipal(); }
  private void role(UserPrincipal p, String... roles) { if (Arrays.stream(roles).noneMatch(p.role()::equals)) throw error(HttpStatus.FORBIDDEN,"No tienes permisos para esta acción"); }
  private Map<String,Object> map(Object... pairs) { Map<String,Object> m=new LinkedHashMap<>(); for(int i=0;i<pairs.length;i+=2)m.put((String)pairs[i],pairs[i+1]); return m; }

  @PostMapping("/auth/register") public Map<String,Object> register(@Valid @RequestBody Register r) {
    if (db.queryForObject("select count(*) from app_users where lower(email)=lower(?)",Integer.class,r.email())>0) throw error(HttpStatus.CONFLICT,"Ese correo ya está registrado");
    UUID id=UUID.randomUUID(); db.update("insert into app_users(id,name,email,phone,password_hash,role) values(?,?,?,?,?,'CLIENTE')",id,r.name().trim(),r.email().trim().toLowerCase(),Objects.toString(r.phone(),""),passwords.encode(r.password()));
    return map("token",jwt.issue(id,"CLIENTE"),"user",user(id));
  }
  @PostMapping("/auth/login") public Map<String,Object> login(@Valid @RequestBody Login r) {
    var matches=db.query("select id,password_hash,role,active from app_users where lower(email)=lower(?)",(rs,n)->new Object[]{rs.getObject("id",UUID.class),rs.getString("password_hash"),rs.getString("role"),rs.getBoolean("active")},r.email());
    if(matches.isEmpty() || !passwords.matches(r.password(),(String)matches.get(0)[1]) || !(boolean)matches.get(0)[3]) throw error(HttpStatus.UNAUTHORIZED,"Correo o contraseña incorrectos");
    UUID id=(UUID)matches.get(0)[0]; String role=(String)matches.get(0)[2]; return map("token",jwt.issue(id,role),"user",user(id));
  }
  @GetMapping("/auth/me") public Map<String,Object> me(org.springframework.security.core.Authentication a) { return user(principal(a).id()); }
  @PutMapping("/profile") public Map<String,Object> updateProfile(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> b) {
    UserPrincipal p=principal(a); db.update("update app_users set name=?,phone=? where id=?",b.get("name"),Objects.toString(b.get("phone"),""),p.id()); return user(p.id());
  }

  @GetMapping("/categories") public List<String> categories() { return db.queryForList("select distinct category from merchants where active=true order by category",String.class); }
  @GetMapping("/merchants") public List<Map<String,Object>> merchants(@RequestParam(required=false) String category) {
    String sql="select id,owner_id as \"ownerId\",name,category,emoji,description,open,delivery_fee as \"deliveryFee\",rating,area from merchants where active=true";
    return category==null?db.queryForList(sql+" order by name"):db.queryForList(sql+" and category=? order by name",category);
  }
  @GetMapping("/merchants/{id}") public Map<String,Object> merchant(@PathVariable UUID id) {
    Map<String,Object> m=db.queryForMap("select id,owner_id as \"ownerId\",name,category,emoji,description,open,delivery_fee as \"deliveryFee\",rating,area from merchants where id=? and active=true",id);
    m.put("categories",db.queryForList("select name from categories where merchant_id=? and active=true order by name",id).stream().map(x->((Map<?,?>)x).get("name")).toList());
    m.put("products",products(id)); return m;
  }
  private List<Map<String,Object>> products(UUID merchant) { return db.queryForList("select p.id,p.merchant_id as \"merchantId\",p.name,p.description,p.price,p.emoji,p.stock,p.active,coalesce(c.name,'General') as category from products p left join categories c on c.id=p.category_id where p.merchant_id=? and p.active=true order by p.name",merchant); }
  @GetMapping("/coupons/validate") public Map<String,Object> coupon(@RequestParam String code,@RequestParam(defaultValue="0") int subtotal) {
    String c=code.toUpperCase(Locale.ROOT); if(c.equals("BIENVENIDO10"))return map("valid",true,"code",c,"type","pct","value",10,"min",0,"message","10% de descuento");
    if(c.equals("PROMO5000") && subtotal>=20000)return map("valid",true,"code",c,"type","fixed","value",5000,"min",20000,"message","$5.000 de descuento en compras desde $20.000");
    return map("valid",false,"message",c.equals("PROMO5000")?"Este cupón requiere una compra mínima de $20.000":"Cupón no existe o expiró");
  }
  @PostMapping("/cart/validate") public Map<String,Object> validateCart(@RequestBody Map<String,Object> body) {
    List<Map<String,Object>> out=new ArrayList<>(); int subtotal=0;
    for(Object x:(List<?>)body.getOrDefault("items",List.of())) { Map<?,?> item=(Map<?,?>)x; UUID id=UUID.fromString(item.get("productId").toString()); int qty=((Number)item.get("qty")).intValue();
      var rows=db.query("select name,price,stock,active from products where id=?",(rs,n)->new Object[]{rs.getString("name"),rs.getInt("price"),rs.getInt("stock"),rs.getBoolean("active")},id);
      if(rows.isEmpty() || !(boolean)rows.get(0)[3] || (int)rows.get(0)[2]<qty) out.add(map("productId",id,"name",rows.isEmpty()?"Producto":rows.get(0)[0],"available",rows.isEmpty()?0:rows.get(0)[2])); else subtotal+=(int)rows.get(0)[1]*qty;
    }
    return map("ok",out.isEmpty(),"outOfStock",out,"subtotal",subtotal);
  }

  @GetMapping("/addresses") public List<Map<String,Object>> addresses(org.springframework.security.core.Authentication a) { UserPrincipal p=principal(a); return db.queryForList("select id,user_id as \"userId\",label,street,city,notes,is_default as \"isDefault\" from addresses where user_id=? order by is_default desc,created_at",p.id()); }
  @PostMapping("/addresses") public Map<String,Object> addAddress(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> b) {
    UserPrincipal p=principal(a); UUID id=UUID.randomUUID(); boolean first=db.queryForObject("select count(*) from addresses where user_id=?",Integer.class,p.id())==0;
    db.update("insert into addresses(id,user_id,label,street,city,notes,is_default) values(?,?,?,?,?,?,?)",id,p.id(),b.get("label"),b.get("street"),Objects.toString(b.getOrDefault("city","Bogotá")),Objects.toString(b.get("notes"),""),first);
    return db.queryForMap("select id,user_id as \"userId\",label,street,city,notes,is_default as \"isDefault\" from addresses where id=?",id);
  }
  @PutMapping("/addresses/{id}") public Map<String,Object> editAddress(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) {
    UserPrincipal p=principal(a); int changed=db.update("update addresses set label=?,street=?,city=?,notes=? where id=? and user_id=?",b.get("label"),b.get("street"),b.get("city"),Objects.toString(b.get("notes"),""),id,p.id());
    if(changed==0)throw error(HttpStatus.NOT_FOUND,"Dirección no encontrada"); return db.queryForMap("select id,user_id as \"userId\",label,street,city,notes,is_default as \"isDefault\" from addresses where id=?",id);
  }
  @PatchMapping("/addresses/{id}/default") public Map<String,Object> defaultAddress(org.springframework.security.core.Authentication a,@PathVariable UUID id) {
    UserPrincipal p=principal(a); db.update("update addresses set is_default=(id=?) where user_id=?",id,p.id()); return map("ok",true);
  }
  @DeleteMapping("/addresses/{id}") public Map<String,Object> deleteAddress(org.springframework.security.core.Authentication a,@PathVariable UUID id) {
    UserPrincipal p=principal(a); int n=db.update("delete from addresses where id=? and user_id=?",id,p.id()); if(n==0)throw error(HttpStatus.NOT_FOUND,"Dirección no encontrada");
    db.update("update addresses set is_default=true where id=(select id from addresses where user_id=? order by created_at limit 1) and not exists(select 1 from addresses where user_id=? and is_default)",p.id(),p.id()); return map("ok",true);
  }

  @PostMapping("/orders") @Transactional public Map<String,Object> createOrder(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> body) {
    UserPrincipal p=principal(a); role(p,"CLIENTE"); UUID merchantId=UUID.fromString(body.get("merchantId").toString()),addressId=UUID.fromString(body.get("addressId").toString());
    Map<String,Object> m=db.queryForMap("select id,name,open,delivery_fee as fee from merchants where id=? and active=true",merchantId);
    if(!(boolean)m.get("open"))throw error(HttpStatus.CONFLICT,"Este comercio no está recibiendo pedidos ahora");
    Map<String,Object> addr; try{addr=db.queryForMap("select label,street,city from addresses where id=? and user_id=?",addressId,p.id());}catch(Exception ex){throw error(HttpStatus.BAD_REQUEST,"Selecciona una dirección de entrega");}
    List<Map<String,Object>> items=new ArrayList<>(); int subtotal=0;
    for(Object x:(List<?>)body.getOrDefault("items",List.of())) { Map<?,?> it=(Map<?,?>)x; UUID productId=UUID.fromString(it.get("productId").toString()); int qty=((Number)it.get("qty")).intValue();
      List<Map<String,Object>> found=db.queryForList("select id,merchant_id as \"merchantId\",name,price,stock,emoji,active from products where id=? for update",productId);
      if(found.isEmpty() || !found.get(0).get("merchantId").equals(merchantId) || !(boolean)found.get(0).get("active") || ((Number)found.get(0).get("stock")).intValue()<qty) {
        int available=found.isEmpty()?0:((Number)found.get(0).get("stock")).intValue(); throw new ApiException(HttpStatus.CONFLICT,"Algunos productos se agotaron mientras comprabas");
      }
      Map<String,Object> pr=found.get(0); subtotal+=((Number)pr.get("price")).intValue()*qty; items.add(map("productId",productId,"name",pr.get("name"),"price",pr.get("price"),"qty",qty,"emoji",pr.get("emoji")));
    }
    if(items.isEmpty())throw error(HttpStatus.BAD_REQUEST,"Agrega productos antes de confirmar el pedido");
    String code=Objects.toString(body.get("coupon"),""); Map<String,Object> c=code.isBlank()?map("valid",false):coupon(code,subtotal);
    int discount=Boolean.TRUE.equals(c.get("valid"))?("pct".equals(c.get("type"))?Math.round(subtotal*((Number)c.get("value")).intValue()/100f):Math.min(((Number)c.get("value")).intValue(),subtotal)):0;
    int fee=((Number)m.get("fee")).intValue(),total=subtotal-discount+fee; UUID orderId=UUID.randomUUID(); String snapshot=addr.get("label")+": "+addr.get("street")+", "+addr.get("city");
    db.update("insert into orders(id,customer_id,merchant_id,address_id,address_snapshot,subtotal,discount,delivery_fee,total,coupon,payment_method) values(?,?,?,?,?,?,?,?,?,?,?)",orderId,p.id(),merchantId,addressId,snapshot,subtotal,discount,fee,total,discount>0?code.toUpperCase(Locale.ROOT):null,Objects.toString(body.get("paymentMethod"),"TARJETA"));
    for(Map<String,Object> it:items) { db.update("insert into order_items(order_id,product_id,name_snapshot,price_snapshot,quantity,emoji_snapshot) values(?,?,?,?,?,?)",orderId,it.get("productId"),it.get("name"),it.get("price"),it.get("qty"),it.get("emoji")); db.update("update products set stock=stock-? where id=?",it.get("qty"),it.get("productId")); }
    db.update("insert into order_events(order_id,status) values(?,'PENDIENTE')",orderId); return order(orderId);
  }
  @GetMapping("/orders") public List<Map<String,Object>> orders(org.springframework.security.core.Authentication a,@RequestParam(required=false) String status) {
    UserPrincipal p=principal(a); String sql="select o.id from orders o join merchants m on m.id=o.merchant_id where "; Object[] args;
    if(p.role().equals("CLIENTE")){sql+="o.customer_id=?";args=new Object[]{p.id()};} else if(p.role().equals("COMERCIO")){sql+="m.owner_id=?";args=new Object[]{p.id()};} else if(p.role().equals("ADMINISTRADOR")){sql+="true";args=new Object[]{};} else {return List.of();}
    if(status!=null){sql+=" and o.status=?";Object[] next=Arrays.copyOf(args,args.length+1);next[args.length]=status;args=next;}
    return db.queryForList(sql+" order by o.created_at desc",args).stream().map(r->order((UUID)r.get("id"))).toList();
  }
  @GetMapping("/orders/{id}") public Map<String,Object> getOrder(org.springframework.security.core.Authentication a,@PathVariable UUID id) { UserPrincipal p=principal(a); Map<String,Object> o=order(id); if(p.role().equals("CLIENTE")&&!o.get("customerId").equals(p.id()))throw error(HttpStatus.FORBIDDEN,"Este pedido no es tuyo");return o; }
  private Map<String,Object> order(UUID id) {
    Map<String,Object> o=db.queryForMap("select o.id,o.code,o.customer_id as \"customerId\",o.merchant_id as \"merchantId\",o.address_snapshot as address,o.subtotal,o.discount,o.delivery_fee as \"deliveryFee\",o.total,o.coupon,o.payment_method as \"paymentMethod\",o.payment_status as \"paymentStatus\",o.status,o.created_at as \"createdAt\",m.name as \"merchantName\",m.emoji as \"merchantEmoji\",u.name as \"customerName\" from orders o join merchants m on m.id=o.merchant_id join app_users u on u.id=o.customer_id where o.id=?",id);
    o.put("code",String.valueOf(o.get("code")));o.put("items",db.queryForList("select product_id as \"productId\",name_snapshot as name,price_snapshot as price,quantity as qty,emoji_snapshot as emoji from order_items where order_id=?",id));
    o.put("history",db.queryForList("select status,created_at as at from order_events where order_id=? order by created_at",id));
    var deliveries=db.query("select d.id,d.status,d.courier_id as \"courierId\",u.name as \"courierName\" from deliveries d left join app_users u on u.id=d.courier_id where d.order_id=?",(rs,n)->map("id",rs.getObject("id",UUID.class),"status",rs.getString("status"),"courierId",rs.getObject("courierId"),"courierName",rs.getString("courierName")),id);
    o.put("delivery",deliveries.isEmpty()?null:deliveries.get(0));o.put("courierName",deliveries.isEmpty()?null:deliveries.get(0).get("courierName"));
    var rating=db.query("select merchant_score,courier_score,comment from ratings where order_id=?",(rs,n)->map("merchant",rs.getInt("merchant_score"),"courier",rs.getInt("courier_score"),"comment",rs.getString("comment")),id);o.put("rating",rating.isEmpty()?null:rating.get(0));return o;
  }
  @PatchMapping("/orders/{id}/status") @Transactional public Map<String,Object> setStatus(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> body) {
    UserPrincipal p=principal(a); Map<String,Object> o=db.queryForMap("select o.status,o.payment_status,o.customer_id,o.merchant_id,m.owner_id from orders o join merchants m on m.id=o.merchant_id where o.id=?",id);
    String before=(String)o.get("status"),next=Objects.toString(body.get("status")); Map<String,List<String>> flow=Map.of("PENDIENTE",List.of("CONFIRMADO","RECHAZADO","CANCELADO"),"CONFIRMADO",List.of("EN_PREPARACION","CANCELADO"),"EN_PREPARACION",List.of("LISTO_PARA_RECOGER","CANCELADO"),"LISTO_PARA_RECOGER",List.of("EN_CAMINO","CANCELADO"),"EN_CAMINO",List.of("ENTREGADO","CANCELADO"));
    if(!flow.getOrDefault(before,List.of()).contains(next))throw error(HttpStatus.CONFLICT,"Transición de pedido inválida");
    if(p.role().equals("CLIENTE")){if(!o.get("customer_id").equals(p.id())||!next.equals("CANCELADO")||!before.equals("PENDIENTE"))throw error(HttpStatus.FORBIDDEN,"Solo puedes cancelar pedidos pendientes");}
    else if(p.role().equals("COMERCIO")){if(!o.get("owner_id").equals(p.id())||!List.of("CONFIRMADO","RECHAZADO","EN_PREPARACION","LISTO_PARA_RECOGER","CANCELADO").contains(next))throw error(HttpStatus.FORBIDDEN,"No puedes actualizar este pedido");}
    else role(p,"ADMINISTRADOR");
    if(next.equals("CONFIRMADO")&&!o.get("payment_status").equals("APROBADO"))throw error(HttpStatus.CONFLICT,"El pago aún no está aprobado");
    db.update("update orders set status=? where id=?",next,id); db.update("insert into order_events(order_id,status) values(?,?)",id,next);
    if(next.equals("CONFIRMADO")) { UUID did=UUID.randomUUID(); db.update("insert into deliveries(id,order_id) values(?,?) on conflict(order_id) do nothing",did,id); db.update("insert into delivery_events(delivery_id,status) values(?,'PENDIENTE') on conflict do nothing",did); }
    if(List.of("CANCELADO","RECHAZADO").contains(next))db.update("update products p set stock=p.stock+i.quantity from order_items i where i.order_id=? and i.product_id=p.id",id);
    return order(id);
  }
  @PostMapping("/payments/simulate") @Transactional public Map<String,Object> simulatePayment(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> b) {
    UserPrincipal p=principal(a); role(p,"CLIENTE"); UUID id=UUID.fromString(b.get("orderId").toString()); String result=Objects.toString(b.get("result"));
    if(!List.of("APROBADO","RECHAZADO","PENDIENTE").contains(result))throw error(HttpStatus.BAD_REQUEST,"Resultado de pago inválido");
    Map<String,Object> o=db.queryForMap("select customer_id,payment_method,total,status,payment_status from orders where id=?",id);
    if(!o.get("customer_id").equals(p.id()))throw error(HttpStatus.NOT_FOUND,"Pedido no encontrado"); if(!o.get("status").equals("PENDIENTE"))throw error(HttpStatus.CONFLICT,"Este pedido ya no admite cambios de pago");
    db.update("update orders set payment_status=? where id=?",result,id); db.update("insert into payments(order_id,method,amount,status,transaction_reference) values(?,?,?,?,?) on conflict(order_id) do update set status=excluded.status,transaction_reference=excluded.transaction_reference",id,o.get("payment_method"),o.get("total"),result,"DEMO-"+UUID.randomUUID()); return order(id);
  }
  @PostMapping("/orders/{id}/rating") @Transactional public Map<String,Object> rateOrder(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) {
    UserPrincipal p=principal(a);role(p,"CLIENTE");Map<String,Object> o=db.queryForMap("select customer_id,merchant_id,status from orders where id=?",id);if(!o.get("customer_id").equals(p.id()))throw error(HttpStatus.NOT_FOUND,"Pedido no encontrado");if(!o.get("status").equals("ENTREGADO"))throw error(HttpStatus.CONFLICT,"Solo puedes calificar pedidos entregados");
    int merchant=((Number)b.get("merchant")).intValue(),courier=((Number)b.get("courier")).intValue();if(merchant<1||merchant>5||courier<1||courier>5)throw error(HttpStatus.BAD_REQUEST,"La calificación debe estar entre 1 y 5");
    db.update("insert into ratings(order_id,customer_id,merchant_score,courier_score,comment) values(?,?,?,?,?)",id,p.id(),merchant,courier,Objects.toString(b.get("comment"),""));db.update("update merchants set rating=(select round(avg(r.merchant_score)::numeric,1) from ratings r join orders x on x.id=r.order_id where x.merchant_id=?) where id=?",o.get("merchant_id"),o.get("merchant_id"));return order(id);
  }
  @GetMapping("/admin/stats") public Map<String,Object> adminStats(org.springframework.security.core.Authentication a) {
    role(principal(a),"ADMINISTRADOR"); return db.queryForMap("select (select count(*) from app_users) as users,(select count(*) from merchants where active) as merchants,(select count(*) from orders) as orders,(select coalesce(sum(total),0) from orders where status='ENTREGADO') as revenue,(select count(*) from deliveries where status in ('ASIGNADA','RECOGIDA','EN_CAMINO')) as \"activeDeliveries\",(select count(*) from deliveries where status='PENDIENTE') as \"pendingDeliveries\"");
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
  @GetMapping("/admin/merchants") public List<Map<String,Object>> adminMerchants(org.springframework.security.core.Authentication a) { role(principal(a),"ADMINISTRADOR");return db.queryForList("select m.id,m.owner_id as \"ownerId\",m.name,m.category,m.emoji,m.description,m.open,m.active,m.delivery_fee as \"deliveryFee\",m.rating,m.area,u.name as \"ownerName\",u.email as \"ownerEmail\" from merchants m join app_users u on u.id=m.owner_id order by m.created_at desc"); }
  @PostMapping("/admin/merchants") @Transactional public Map<String,Object> addMerchant(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> b) { role(principal(a),"ADMINISTRADOR");String email=Objects.toString(b.get("ownerEmail")).toLowerCase();if(db.queryForObject("select count(*) from app_users where lower(email)=?",Integer.class,email)>0)throw error(HttpStatus.CONFLICT,"El correo del propietario ya está registrado");UUID owner=UUID.randomUUID(),merchant=UUID.randomUUID();db.update("insert into app_users(id,name,email,password_hash,role) values(?,?,?,?, 'COMERCIO')",owner,b.get("ownerName"),email,passwords.encode(Objects.toString(b.get("ownerPassword"))));db.update("insert into merchants(id,owner_id,name,category,emoji,description,delivery_fee,open) values(?,?,?,?,?,?,?,false)",merchant,owner,b.get("name"),b.get("category"),Objects.toString(b.get("emoji"),"🍽️"),Objects.toString(b.get("description"),""),Integer.parseInt(Objects.toString(b.get("deliveryFee"),"3000")));return db.queryForMap("select m.id,m.owner_id as \"ownerId\",m.name,m.category,m.emoji,m.description,m.open,m.active,m.delivery_fee as \"deliveryFee\",m.rating,m.area,u.name as \"ownerName\",u.email as \"ownerEmail\" from merchants m join app_users u on u.id=m.owner_id where m.id=?",merchant); }
  @PatchMapping("/admin/merchants/{id}/active") public Map<String,Object> setMerchantActive(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) { role(principal(a),"ADMINISTRADOR");int n=db.update("update merchants set active=? where id=?",Boolean.TRUE.equals(b.get("active")),id);if(n==0)throw error(HttpStatus.NOT_FOUND,"Comercio no encontrado");return db.queryForMap("select id,name,category,active,open,delivery_fee as \"deliveryFee\" from merchants where id=?",id); }
  @GetMapping("/admin/couriers") public List<Map<String,Object>> couriers(org.springframework.security.core.Authentication a) { role(principal(a),"ADMINISTRADOR");return db.queryForList("select id,name,email,phone,role,available,active,created_at as \"createdAt\" from app_users where role='REPARTIDOR' order by name"); }
  @GetMapping("/admin/deliveries") public List<Map<String,Object>> allDeliveries(org.springframework.security.core.Authentication a) { role(principal(a),"ADMINISTRADOR");return db.queryForList("select id from deliveries order by created_at desc").stream().map(r->{Map<String,Object>d=delivery((UUID)r.get("id"));d.put("courierName",d.get("order") instanceof Map<?,?> o?o.get("courierName"):null);return d;}).toList(); }
  @PostMapping("/admin/deliveries/{id}/assign") @Transactional public Map<String,Object> assignDelivery(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) { role(principal(a),"ADMINISTRADOR");UUID courier=UUID.fromString(b.get("courierId").toString());if(!db.queryForObject("select count(*) from app_users where id=? and role='REPARTIDOR' and active=true",Integer.class,courier).equals(1))throw error(HttpStatus.NOT_FOUND,"Repartidor no encontrado");int n=db.update("update deliveries set courier_id=?,status='ASIGNADA' where id=? and status in ('PENDIENTE','ASIGNADA')",courier,id);if(n==0)throw error(HttpStatus.CONFLICT,"Ya no se puede asignar esta entrega");db.update("insert into delivery_events(delivery_id,status) values(?,'ASIGNADA')",id);return delivery(id); }

  private Map<String,Object> delivery(UUID id) {
    Map<String,Object> d=db.queryForMap("select id,order_id as \"orderId\",courier_id as \"courierId\",status from deliveries where id=?",id);
    d.put("history",db.queryForList("select status,created_at as at from delivery_events where delivery_id=? order by created_at",id));d.put("order",order((UUID)d.get("orderId")));return d;
  }
  @GetMapping("/deliveries") public Map<String,Object> deliveries(org.springframework.security.core.Authentication a) {
    UserPrincipal p=principal(a);role(p,"REPARTIDOR");boolean available=db.queryForObject("select available from app_users where id=?",Boolean.class,p.id());
    List<UUID> mine=db.queryForList("select id from deliveries where courier_id=? order by created_at desc",UUID.class,p.id());
    List<UUID> open=available?db.queryForList("select id from deliveries where courier_id is null and status='PENDIENTE' order by created_at",UUID.class):List.of();
    return map("mine",mine.stream().map(this::delivery).toList(),"available",open.stream().map(this::delivery).toList());
  }
  @PatchMapping("/courier/availability") public Map<String,Object> availability(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> b) { UserPrincipal p=principal(a);role(p,"REPARTIDOR");db.update("update app_users set available=? where id=?",Boolean.TRUE.equals(b.get("available")),p.id());return user(p.id()); }
  @PostMapping("/deliveries/{id}/take") @Transactional public Map<String,Object> takeDelivery(org.springframework.security.core.Authentication a,@PathVariable UUID id) {
    UserPrincipal p=principal(a);role(p,"REPARTIDOR");if(!db.queryForObject("select available from app_users where id=?",Boolean.class,p.id()))throw error(HttpStatus.CONFLICT,"Activa tu disponibilidad para tomar entregas");
    int n=db.update("update deliveries set courier_id=?,status='ASIGNADA' where id=? and courier_id is null and status='PENDIENTE'",p.id(),id);if(n==0)throw error(HttpStatus.CONFLICT,"Otra persona ya tomó esta entrega");db.update("insert into delivery_events(delivery_id,status) values(?,'ASIGNADA')",id);return delivery(id);
  }
  @PatchMapping("/deliveries/{id}/status") @Transactional public Map<String,Object> updateDelivery(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) {
    UserPrincipal p=principal(a);role(p,"REPARTIDOR","ADMINISTRADOR");String next=Objects.toString(b.get("status"));Map<String,Object>d=db.queryForMap("select order_id,courier_id,status from deliveries where id=?",id);
    if(p.role().equals("REPARTIDOR")&&!p.id().equals(d.get("courier_id")))throw error(HttpStatus.FORBIDDEN,"Esta entrega no es tuya");String before=(String)d.get("status");Map<String,List<String>> flow=Map.of("ASIGNADA",List.of("RECOGIDA","CANCELADA"),"RECOGIDA",List.of("EN_CAMINO","CANCELADA"),"EN_CAMINO",List.of("ENTREGADA","CANCELADA"));if(!flow.getOrDefault(before,List.of()).contains(next))throw error(HttpStatus.CONFLICT,"Transición de entrega inválida");
    UUID oid=(UUID)d.get("order_id");Map<String,Object> o=db.queryForMap("select status from orders where id=?",oid);if(next.equals("RECOGIDA")&&!o.get("status").equals("LISTO_PARA_RECOGER"))throw error(HttpStatus.CONFLICT,"El comercio aún no marca el pedido como listo para recoger");
    db.update("update deliveries set status=? where id=?",next,id);db.update("insert into delivery_events(delivery_id,status) values(?,?)",id,next);String os=switch(next){case "EN_CAMINO"->"EN_CAMINO";case "ENTREGADA"->"ENTREGADO";case "CANCELADA"->"CANCELADO";default->null;};if(os!=null){db.update("update orders set status=? where id=?",os,oid);db.update("insert into order_events(order_id,status) values(?,?)",oid,os);}return delivery(id);
  }
  @GetMapping("/notifications") public List<Map<String,Object>> notifications(org.springframework.security.core.Authentication a) { return db.queryForList("select id,user_id as \"userId\",text,read,created_at as \"createdAt\" from notifications where user_id=? order by created_at desc limit 50",principal(a).id()); }
  @PatchMapping("/notifications/read-all") public Map<String,Object> readNotifications(org.springframework.security.core.Authentication a) { db.update("update notifications set read=true where user_id=?",principal(a).id());return map("ok",true); }
  @PatchMapping("/notifications/{id}/read") public Map<String,Object> readNotification(org.springframework.security.core.Authentication a,@PathVariable UUID id) { db.update("update notifications set read=true where id=? and user_id=?",id,principal(a).id());return map("ok",true); }

  private UUID ownMerchant(UserPrincipal p) { role(p,"COMERCIO"); return db.queryForObject("select id from merchants where owner_id=?",UUID.class,p.id()); }
  @GetMapping("/my/merchant") public Map<String,Object> myMerchant(org.springframework.security.core.Authentication a) { return db.queryForMap("select id,owner_id as \"ownerId\",name,category,emoji,description,open,delivery_fee as \"deliveryFee\",rating,area from merchants where owner_id=?",principal(a).id()); }
  @PatchMapping("/my/merchant") public Map<String,Object> setMerchantAvailability(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> b) { UUID id=ownMerchant(principal(a));db.update("update merchants set open=? where id=?",Boolean.TRUE.equals(b.get("open")),id);return db.queryForMap("select id,owner_id as \"ownerId\",name,category,emoji,description,open,delivery_fee as \"deliveryFee\",rating,area from merchants where id=?",id); }
  @GetMapping("/my/products") public List<Map<String,Object>> myProducts(org.springframework.security.core.Authentication a) { return db.queryForList("select p.id,p.merchant_id as \"merchantId\",p.name,p.description,p.price,p.emoji,p.stock,p.active,coalesce(c.name,'General') as category from products p left join categories c on c.id=p.category_id where p.merchant_id=? order by p.name",ownMerchant(principal(a))); }
  @PostMapping("/my/products") public Map<String,Object> createProduct(org.springframework.security.core.Authentication a,@RequestBody Map<String,Object> b) { UUID merchant=ownMerchant(principal(a));String category=Objects.toString(b.get("category"),"General");UUID categoryId=category(merchant,category);UUID id=UUID.randomUUID();db.update("insert into products(id,merchant_id,category_id,name,description,price,emoji,stock,active) values(?,?,?,?,?,?,?,?,?)",id,merchant,categoryId,b.get("name"),Objects.toString(b.get("description"),""),Integer.parseInt(b.get("price").toString()),Objects.toString(b.get("emoji"),"🍽️"),Integer.parseInt(b.get("stock").toString()),!Boolean.FALSE.equals(b.get("active")));return myProductsFor(merchant,id); }
  @PutMapping("/my/products/{id}") public Map<String,Object> editProduct(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) { UUID merchant=ownMerchant(principal(a));UUID cat=category(merchant,Objects.toString(b.get("category"),"General"));int n=db.update("update products set name=?,description=?,price=?,category_id=?,emoji=?,stock=?,active=? where id=? and merchant_id=?",b.get("name"),Objects.toString(b.get("description"),""),Integer.parseInt(b.get("price").toString()),cat,Objects.toString(b.get("emoji"),"🍽️"),Integer.parseInt(b.get("stock").toString()),!Boolean.FALSE.equals(b.get("active")),id,merchant);if(n==0)throw error(HttpStatus.NOT_FOUND,"Producto no encontrado");return myProductsFor(merchant,id); }
  @DeleteMapping("/my/products/{id}") public Map<String,Object> deleteProduct(org.springframework.security.core.Authentication a,@PathVariable UUID id) { int n=db.update("delete from products where id=? and merchant_id=?",id,ownMerchant(principal(a)));if(n==0)throw error(HttpStatus.NOT_FOUND,"Producto no encontrado");return map("ok",true); }
  @PatchMapping("/my/products/{id}/stock") public Map<String,Object> setStock(org.springframework.security.core.Authentication a,@PathVariable UUID id,@RequestBody Map<String,Object> b) { UUID merchant=ownMerchant(principal(a));int stock=Integer.parseInt(b.get("stock").toString());if(stock<0)throw error(HttpStatus.BAD_REQUEST,"El stock no puede ser negativo");int n=db.update("update products set stock=? where id=? and merchant_id=?",stock,id,merchant);if(n==0)throw error(HttpStatus.NOT_FOUND,"Producto no encontrado");return myProductsFor(merchant,id); }
  private UUID category(UUID merchant,String name) { db.update("insert into categories(merchant_id,name) values(?,?) on conflict(merchant_id,name) do nothing",merchant,name);return db.queryForObject("select id from categories where merchant_id=? and name=?",UUID.class,merchant,name); }
  private Map<String,Object> myProductsFor(UUID merchant,UUID id) { return db.queryForMap("select p.id,p.merchant_id as \"merchantId\",p.name,p.description,p.price,p.emoji,p.stock,p.active,coalesce(c.name,'General') as category from products p left join categories c on c.id=p.category_id where p.merchant_id=? and p.id=?",merchant,id); }
}

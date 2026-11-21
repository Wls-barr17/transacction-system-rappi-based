package co.domiflow.api.service;

import static co.domiflow.api.ApiErrors.ApiException;

import co.domiflow.api.security.UserPrincipal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
  private final JdbcTemplate db;
  private final CatalogService catalog;
  public OrderService(JdbcTemplate db, CatalogService catalog) { this.db = db; this.catalog = catalog; }

  @Transactional
  public Map<String, Object> create(UserPrincipal customer, Map<String, Object> body) {
    requireRole(customer, "CLIENTE");
    UUID merchantId = parseUuid(body.get("merchantId"), "Comercio"), addressId = parseUuid(body.get("addressId"), "Dirección");
    String method = Objects.toString(body.get("paymentMethod"), "TARJETA");
    if (!List.of("TARJETA", "PSE", "EFECTIVO").contains(method)) throw fail(HttpStatus.BAD_REQUEST, "Método de pago no válido");

    Map<String, Object> merchant = db.queryForMap("select id,name,open,delivery_fee as fee from merchants where id=? and active=true", merchantId);
    if (!Boolean.TRUE.equals(merchant.get("open"))) throw fail(HttpStatus.CONFLICT, "Este comercio no está recibiendo pedidos ahora");
    Map<String, Object> address;
    try { address = db.queryForMap("select label,street,neighborhood,city from addresses where id=? and user_id=?", addressId, customer.id()); }
    catch (org.springframework.dao.EmptyResultDataAccessException ex) { throw fail(HttpStatus.BAD_REQUEST, "Selecciona una dirección de entrega"); }

    Object rawItems = body.get("items");
    if (!(rawItems instanceof List<?> requested) || requested.isEmpty()) throw fail(HttpStatus.BAD_REQUEST, "Agrega productos antes de confirmar el pedido");
    Map<UUID, Integer> quantities = new LinkedHashMap<>();
    for (Object raw : requested) {
      if (!(raw instanceof Map<?, ?> line) || !(line.get("qty") instanceof Number quantity)) throw fail(HttpStatus.BAD_REQUEST, "Cada producto debe incluir una cantidad válida");
      UUID productId = parseUuid(line.get("productId"), "Producto"); int qty = quantity.intValue();
      if (qty < 1 || qty > 100) throw fail(HttpStatus.BAD_REQUEST, "La cantidad por producto debe estar entre 1 y 100");
      try { quantities.merge(productId, qty, Math::addExact); }
      catch (ArithmeticException ex) { throw fail(HttpStatus.BAD_REQUEST, "La cantidad total de un producto es demasiado alta"); }
    }

    List<Map<String, Object>> items = new ArrayList<>(), unavailable = new ArrayList<>(); long subtotalLong = 0;
    for (var entry : quantities.entrySet()) {
      UUID productId = entry.getKey(); int qty = entry.getValue();
      List<Map<String, Object>> matches = db.queryForList("select p.id,p.merchant_id as \"merchantId\",p.name,p.price,i.available_quantity as stock,p.emoji,p.active from products p join product_inventory i on i.product_id=p.id where p.id=? for update of p,i", productId);
      if (matches.isEmpty() || !merchantId.equals(matches.get(0).get("merchantId")) || !Boolean.TRUE.equals(matches.get(0).get("active")) || ((Number) matches.get(0).get("stock")).intValue() < qty) {
        int stock = matches.isEmpty() ? 0 : ((Number) matches.get(0).get("stock")).intValue();
        unavailable.add(map("productId", productId, "name", matches.isEmpty() ? "Producto" : matches.get(0).get("name"), "available", stock));
        continue;
      }
      Map<String, Object> product = matches.get(0); int price = ((Number) product.get("price")).intValue(); subtotalLong += (long) price * qty;
      items.add(map("productId", productId, "name", product.get("name"), "price", price, "qty", qty, "emoji", product.get("emoji")));
    }
    if (!unavailable.isEmpty()) throw new ApiException(HttpStatus.CONFLICT, "Algunos productos se agotaron mientras comprabas", Map.of("outOfStock", unavailable));
    if (subtotalLong > Integer.MAX_VALUE) throw fail(HttpStatus.BAD_REQUEST, "El valor del pedido supera el límite permitido");
    int subtotal = (int) subtotalLong; String couponCode = Objects.toString(body.get("coupon"), "");
    Map<String, Object> coupon = couponCode.isBlank() ? map("valid", false) : catalog.coupon(couponCode, subtotal, merchantId);
    int discount = Boolean.TRUE.equals(coupon.get("valid"))
      ? ("pct".equals(coupon.get("type")) ? Math.round(subtotal * ((Number) coupon.get("value")).intValue() / 100f) : Math.min(((Number) coupon.get("value")).intValue(), subtotal)) : 0;
    int fee = ((Number) merchant.get("fee")).intValue(); long totalLong = (long) subtotal - discount + fee;
    if (totalLong > Integer.MAX_VALUE) throw fail(HttpStatus.BAD_REQUEST, "El valor del pedido supera el límite permitido");
    int total = (int) totalLong; UUID orderId = UUID.randomUUID();
    String neighborhood = Objects.toString(address.get("neighborhood"), "").trim();
    String addressSnapshot = address.get("label") + ": " + address.get("street") + (neighborhood.isBlank() ? "" : ", " + neighborhood) + ", " + address.get("city");
    db.update("insert into orders(id,customer_id,merchant_id,address_id,address_snapshot,subtotal,discount,delivery_fee,total,coupon,payment_method) values(?,?,?,?,?,?,?,?,?,?,?)",
      orderId, customer.id(), merchantId, addressId, addressSnapshot, subtotal, discount, fee, total, discount > 0 ? couponCode.toUpperCase(Locale.ROOT) : null, method);
    if (discount > 0) catalog.redeemCoupon(couponCode, subtotal, merchantId, orderId, customer.id(), discount);
    for (Map<String, Object> item : items) {
      db.update("insert into order_items(order_id,product_id,name_snapshot,price_snapshot,quantity,emoji_snapshot) values(?,?,?,?,?,?)", orderId, item.get("productId"), item.get("name"), item.get("price"), item.get("qty"), item.get("emoji"));
      db.update("update product_inventory set available_quantity=available_quantity-? where product_id=?", item.get("qty"), item.get("productId"));
      db.update("insert into stock_movements(product_id,order_id,changed_by,movement_type,quantity_delta,note) values(?,?,?,'VENTA',?,'Descuento por pedido')", item.get("productId"), orderId, customer.id(), -((Number) item.get("qty")).intValue());
    }
    db.update("insert into order_events(order_id,status,changed_by) values(?,'PENDIENTE',?)", orderId, customer.id());
    return find(orderId);
  }

  public List<Map<String, Object>> list(UserPrincipal user, String status) {
    StringBuilder sql = new StringBuilder("select o.id from orders o join merchants m on m.id=o.merchant_id where ");
    Object[] args;
    if (user.role().equals("CLIENTE")) { sql.append("o.customer_id=?"); args = new Object[] { user.id() }; }
    else if (user.role().equals("COMERCIO")) { sql.append("m.owner_id=?"); args = new Object[] { user.id() }; }
    else if (user.role().equals("ADMINISTRADOR")) { sql.append("true"); args = new Object[0]; }
    else return List.of();
    if (status != null && !status.isBlank()) { sql.append(" and o.status=?"); args = Arrays.copyOf(args, args.length + 1); args[args.length - 1] = status; }
    return db.queryForList(sql.append(" order by o.created_at desc").toString(), args).stream().map(row -> find((UUID) row.get("id"))).toList();
  }

  public Map<String, Object> get(UserPrincipal user, UUID orderId) {
    Map<String, Object> order = find(orderId);
    if (user.role().equals("CLIENTE") && !order.get("customerId").equals(user.id())) throw fail(HttpStatus.FORBIDDEN, "Este pedido no es tuyo");
    if (user.role().equals("COMERCIO") && !db.queryForObject("select count(*) from orders o join merchants m on m.id=o.merchant_id where o.id=? and m.owner_id=?", Integer.class, orderId, user.id()).equals(1)) throw fail(HttpStatus.FORBIDDEN, "Este pedido no pertenece a tu comercio");
    if (user.role().equals("REPARTIDOR") && !db.queryForObject("select count(*) from deliveries d join delivery_assignments da on da.delivery_id=d.id and da.unassigned_at is null where d.order_id=? and da.courier_id=?", Integer.class, orderId, user.id()).equals(1)) throw fail(HttpStatus.FORBIDDEN, "Este pedido no está asignado a tu cuenta");
    if (!List.of("CLIENTE", "COMERCIO", "ADMINISTRADOR", "REPARTIDOR").contains(user.role())) throw fail(HttpStatus.FORBIDDEN, "No tienes permisos para consultar pedidos");
    return order;
  }

  /** Internal read model used by delivery and CRM endpoints after their own access checks. */
  public Map<String, Object> getForOperations(UUID orderId) { return find(orderId); }

  @Transactional
  public Map<String, Object> changeStatus(UserPrincipal actor, UUID orderId, String next) {
    Map<String, Object> record = db.queryForMap("select o.status,o.payment_status,o.customer_id,o.merchant_id,m.owner_id from orders o join merchants m on m.id=o.merchant_id where o.id=? for update", orderId);
    String current = (String) record.get("status");
    Map<String, List<String>> transitions = Map.of("PENDIENTE", List.of("CONFIRMADO", "RECHAZADO", "CANCELADO"), "CONFIRMADO", List.of("EN_PREPARACION", "CANCELADO"), "EN_PREPARACION", List.of("LISTO_PARA_RECOGER", "CANCELADO"), "LISTO_PARA_RECOGER", List.of("EN_CAMINO", "CANCELADO"), "EN_CAMINO", List.of("ENTREGADO", "CANCELADO"));
    if (!transitions.getOrDefault(current, List.of()).contains(next)) throw fail(HttpStatus.CONFLICT, "Transición de pedido inválida");
    if (actor.role().equals("CLIENTE")) {
      if (!record.get("customer_id").equals(actor.id()) || !next.equals("CANCELADO") || !current.equals("PENDIENTE")) throw fail(HttpStatus.FORBIDDEN, "Solo puedes cancelar pedidos pendientes");
      if ("APROBADO".equals(record.get("payment_status"))) throw fail(HttpStatus.CONFLICT, "El pago ya fue aprobado; contacta soporte para gestionar la cancelación");
    } else if (actor.role().equals("COMERCIO")) {
      if (!record.get("owner_id").equals(actor.id()) || !List.of("CONFIRMADO", "RECHAZADO", "EN_PREPARACION", "LISTO_PARA_RECOGER", "CANCELADO").contains(next)) throw fail(HttpStatus.FORBIDDEN, "No puedes actualizar este pedido");
    } else requireRole(actor, "ADMINISTRADOR");
    if (next.equals("CONFIRMADO") && !record.get("payment_status").equals("APROBADO")) throw fail(HttpStatus.CONFLICT, "El pago aún no está aprobado");
    db.update("update orders set status=? where id=?", next, orderId); db.update("insert into order_events(order_id,status,changed_by) values(?,?,?)", orderId, next, actor.id());
    notifyUser((UUID) record.get("customer_id"), "Tu pedido ahora está: " + next.toLowerCase(Locale.ROOT).replace('_', ' '));
    if (next.equals("CONFIRMADO")) {
      UUID deliveryId = UUID.randomUUID(); db.update("insert into deliveries(id,order_id) values(?,?) on conflict(order_id) do nothing", deliveryId, orderId);
      db.update("insert into delivery_events(delivery_id,status) values(?,'PENDIENTE') on conflict do nothing", deliveryId);
    }
    if (List.of("CANCELADO", "RECHAZADO").contains(next)) {
      db.update("update product_inventory inventory set available_quantity=inventory.available_quantity+items.quantity from order_items items where items.order_id=? and items.product_id=inventory.product_id", orderId);
      db.update("insert into stock_movements(product_id,order_id,movement_type,quantity_delta,note) select product_id,order_id,'DEVOLUCION',quantity,'Reintegro por cancelación o rechazo' from order_items where order_id=? on conflict(order_id,product_id,movement_type) do nothing", orderId);
    }
    return find(orderId);
  }

  @Transactional
  public Map<String, Object> rate(UserPrincipal customer, UUID orderId, Map<String, Object> input) {
    requireRole(customer, "CLIENTE");
    Map<String, Object> target = db.queryForMap("select customer_id,merchant_id,status from orders where id=?", orderId);
    if (!target.get("customer_id").equals(customer.id())) throw fail(HttpStatus.NOT_FOUND, "Pedido no encontrado");
    if (!target.get("status").equals("ENTREGADO")) throw fail(HttpStatus.CONFLICT, "Solo puedes calificar pedidos entregados");
    int merchantScore = score(input.get("merchant")), courierScore = score(input.get("courier"));
    db.update("insert into ratings(order_id,customer_id,merchant_score,courier_score,comment) values(?,?,?,?,?)", orderId, customer.id(), merchantScore, courierScore, Objects.toString(input.get("comment"), ""));
    return find(orderId);
  }

  private Map<String, Object> find(UUID id) {
    Map<String, Object> order = db.queryForMap("select o.id,o.code,o.customer_id as \"customerId\",o.merchant_id as \"merchantId\",o.address_snapshot as address,o.subtotal,o.discount,o.delivery_fee as \"deliveryFee\",o.total,o.coupon,o.payment_method as \"paymentMethod\",o.payment_status as \"paymentStatus\",o.status,o.created_at as \"createdAt\",m.name as \"merchantName\",m.emoji as \"merchantEmoji\",u.name as \"customerName\" from orders o join merchants m on m.id=o.merchant_id join app_users u on u.id=o.customer_id where o.id=?", id);
    order.put("code", String.valueOf(order.get("code")));
    order.put("items", db.queryForList("select product_id as \"productId\",name_snapshot as name,price_snapshot as price,quantity as qty,emoji_snapshot as emoji from order_items where order_id=?", id));
    order.put("history", db.queryForList("select status,created_at as at from order_events where order_id=? order by created_at", id));
    order.put("paymentAttempts", db.queryForList("select attempt_number as \"attemptNumber\",method,amount,status,transaction_reference as \"transactionReference\",provider_response->>'transactionId' as \"providerTransactionId\",provider_response->>'paymentMethodType' as \"paymentMethodType\",created_at as \"createdAt\" from payment_attempts where order_id=? order by attempt_number desc", id));
    var deliveries = db.query("select d.id,d.status,da.courier_id as \"courierId\",u.name as \"courierName\" from deliveries d left join delivery_assignments da on da.delivery_id=d.id and da.unassigned_at is null left join app_users u on u.id=da.courier_id where d.order_id=?", (rs, row) -> map("id", rs.getObject("id", UUID.class), "status", rs.getString("status"), "courierId", rs.getObject("courierId"), "courierName", rs.getString("courierName")), id);
    order.put("delivery", deliveries.isEmpty() ? null : deliveries.get(0)); order.put("courierName", deliveries.isEmpty() ? null : deliveries.get(0).get("courierName"));
    var rating = db.query("select merchant_score,courier_score,comment from ratings where order_id=?", (rs, row) -> map("merchant", rs.getInt("merchant_score"), "courier", rs.getInt("courier_score"), "comment", rs.getString("comment")), id);
    order.put("rating", rating.isEmpty() ? null : rating.get(0)); return order;
  }
  private void notifyUser(UUID id, String text) { db.update("insert into notifications(user_id,text) values(?,?)", id, text); }
  private void requireRole(UserPrincipal user, String role) { if (!user.role().equals(role)) throw fail(HttpStatus.FORBIDDEN, "No tienes permisos para esta acción"); }
  private UUID parseUuid(Object value, String label) { try { if (value == null) throw new IllegalArgumentException(); return UUID.fromString(value.toString()); } catch (IllegalArgumentException e) { throw fail(HttpStatus.BAD_REQUEST, label + " no válido"); } }
  private int score(Object value) { if (!(value instanceof Number number) || number.intValue() < 1 || number.intValue() > 5) throw fail(HttpStatus.BAD_REQUEST, "La calificación debe estar entre 1 y 5"); return number.intValue(); }
  private Map<String, Object> map(Object... values) { Map<String, Object> result = new LinkedHashMap<>(); for (int i=0; i<values.length; i+=2) result.put((String) values[i], values[i+1]); return result; }
  private ApiException fail(HttpStatus status, String message) { return new ApiException(status, message); }
}

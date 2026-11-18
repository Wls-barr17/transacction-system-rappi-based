package co.domiflow.api.service;

import static co.domiflow.api.ApiErrors.ApiException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class CatalogService {
  private final JdbcTemplate db;
  public CatalogService(JdbcTemplate db) { this.db = db; }

  public List<String> categories() {
    return db.queryForList("select distinct category from merchants where active=true order by category", String.class);
  }
  public List<Map<String, Object>> merchants(String category) {
    String sql = "select m.id,m.owner_id as \"ownerId\",m.name,m.category,m.emoji,m.image_url as \"imageUrl\",m.description,m.open,m.delivery_fee as \"deliveryFee\",coalesce(r.rating,0) as rating,m.area from merchants m left join v_merchant_ratings r on r.merchant_id=m.id where m.active=true";
    return category == null || category.isBlank()
      ? db.queryForList(sql + " order by name")
      : db.queryForList(sql + " and category=? order by name", category);
  }
  public Map<String, Object> merchant(UUID id) {
    Map<String, Object> merchant;
    try {
      merchant = db.queryForMap("select m.id,m.owner_id as \"ownerId\",m.name,m.category,m.emoji,m.image_url as \"imageUrl\",m.description,m.open,m.delivery_fee as \"deliveryFee\",coalesce(r.rating,0) as rating,m.area from merchants m left join v_merchant_ratings r on r.merchant_id=m.id where m.id=? and m.active=true", id);
    } catch (org.springframework.dao.EmptyResultDataAccessException e) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Comercio no encontrado");
    }
    merchant.put("categories", db.queryForList("select name from categories where merchant_id=? and active=true order by name", id).stream().map(row -> row.get("name")).toList());
    merchant.put("products", db.queryForList("select p.id,p.merchant_id as \"merchantId\",p.name,p.description,p.price,p.emoji,p.image_url as \"imageUrl\",coalesce(i.available_quantity,0) as stock,p.active,c.name as category from products p join categories c on c.id=p.category_id left join product_inventory i on i.product_id=p.id where p.merchant_id=? and p.active=true order by p.name", id));
    return merchant;
  }
  public Map<String, Object> coupon(String code, int subtotal) { return coupon(code, subtotal, null); }

  public Map<String, Object> coupon(String code, int subtotal, UUID merchantId) {
    String normalized = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
    if (normalized.isBlank()) return map("valid", false, "message", "Escribe un código de cupón");
    var rows = db.query("select c.id as coupon_id,c.code,c.active as coupon_active,p.id as promotion_id,p.active as promotion_active,p.discount_type,p.discount_value,p.min_subtotal,p.starts_at,p.ends_at,p.max_redemptions,(select count(*) from coupon_redemptions cr join coupons used on used.id=cr.coupon_id where used.promotion_id=p.id) as redemption_count from coupons c join promotions p on p.id=c.promotion_id where c.code=? and (not exists(select 1 from promotion_merchants pm where pm.promotion_id=p.id) or exists(select 1 from promotion_merchants pm where pm.promotion_id=p.id and pm.merchant_id=?))",
      (rs, row) -> {
        Map<String, Object> item = new LinkedHashMap<>();
        for (String column : List.of("coupon_id", "code", "coupon_active", "promotion_id", "promotion_active", "discount_type", "discount_value", "min_subtotal", "starts_at", "ends_at", "max_redemptions", "redemption_count")) item.put(column, rs.getObject(column));
        return item;
      }, normalized, merchantId);
    if (rows.isEmpty()) return map("valid", false, "message", "Cupón no existe o no aplica a este comercio");
    Map<String, Object> promotion = rows.get(0);
    if (!Boolean.TRUE.equals(promotion.get("coupon_active")) || !Boolean.TRUE.equals(promotion.get("promotion_active"))) return map("valid", false, "message", "Esta promoción ya no está activa");
    java.time.OffsetDateTime now = java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC);
    java.time.OffsetDateTime starts = asOffsetDateTime(promotion.get("starts_at"));
    java.time.OffsetDateTime ends = promotion.get("ends_at") == null ? null : asOffsetDateTime(promotion.get("ends_at"));
    if (now.isBefore(starts) || (ends != null && !now.isBefore(ends))) return map("valid", false, "message", "Este cupón está fuera de su vigencia");
    Object limit = promotion.get("max_redemptions");
    if (limit != null && ((Number) promotion.get("redemption_count")).longValue() >= ((Number) limit).longValue()) return map("valid", false, "message", "Este cupón alcanzó su límite de usos");
    int minimum = ((Number) promotion.get("min_subtotal")).intValue();
    if (subtotal < minimum) return map("valid", false, "message", "La compra mínima para este cupón es $" + String.format(Locale.ROOT, "%,d", minimum));
    String type = "PERCENTAGE".equals(promotion.get("discount_type")) ? "pct" : "fixed";
    int value = ((Number) promotion.get("discount_value")).intValue();
    return map("valid", true, "code", normalized, "type", type, "value", value, "min", minimum, "message", "pct".equals(type) ? value + "% de descuento" : "$" + String.format(Locale.ROOT, "%,d", value) + " de descuento");
  }

  @org.springframework.transaction.annotation.Transactional
  public void redeemCoupon(String code, int subtotal, UUID merchantId, UUID orderId, UUID userId, int discount) {
    String normalized = code.trim().toUpperCase(Locale.ROOT);
    var matches = db.query("select c.id as coupon_id,p.id as promotion_id,p.max_redemptions,(select count(*) from coupon_redemptions cr join coupons used on used.id=cr.coupon_id where used.promotion_id=p.id) as redemption_count from coupons c join promotions p on p.id=c.promotion_id where c.code=? and c.active=true and p.active=true and p.starts_at<=now() and (p.ends_at is null or p.ends_at>now()) and p.min_subtotal<=? and (not exists(select 1 from promotion_merchants pm where pm.promotion_id=p.id) or exists(select 1 from promotion_merchants pm where pm.promotion_id=p.id and pm.merchant_id=?)) for update of c,p",
      (rs, row) -> new Object[] { rs.getObject("coupon_id", UUID.class), rs.getObject("max_redemptions"), rs.getLong("redemption_count") }, normalized, subtotal, merchantId);
    if (matches.isEmpty()) throw new ApiException(HttpStatus.CONFLICT, "El cupón dejó de estar disponible. Vuelve a validar el código.");
    Object[] match=matches.get(0);Object max=match[1];
    if(max!=null&&((Number)match[2]).longValue()>=((Number)max).longValue())throw new ApiException(HttpStatus.CONFLICT,"Este cupón alcanzó su límite de usos.");
    db.update("insert into coupon_redemptions(coupon_id,order_id,user_id,discount_amount) values(?,?,?,?)", match[0], orderId, userId, discount);
  }
  public Map<String, Object> validateCart(Map<String, Object> input) {
    Object raw = input.getOrDefault("items", List.of());
    if (!(raw instanceof List<?> items)) throw new ApiException(HttpStatus.BAD_REQUEST, "El carrito no tiene un formato válido");
    List<Map<String, Object>> outOfStock = new ArrayList<>();
    int subtotal = 0;
    for (Object rawItem : items) {
      if (!(rawItem instanceof Map<?, ?> item) || item.get("productId") == null || !(item.get("qty") instanceof Number quantity)) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Cada producto debe incluir identificador y cantidad");
      }
      int qty = quantity.intValue();
      if (qty < 1) throw new ApiException(HttpStatus.BAD_REQUEST, "La cantidad mínima de un producto es 1");
      UUID id;
      try { id = UUID.fromString(item.get("productId").toString()); }
      catch (IllegalArgumentException e) { throw new ApiException(HttpStatus.BAD_REQUEST, "El identificador de un producto no es válido"); }
      var products = db.query("select p.name,p.price,coalesce(i.available_quantity,0) as stock,p.active from products p left join product_inventory i on i.product_id=p.id where p.id=?", (rs, row) -> new Object[] { rs.getString("name"), rs.getInt("price"), rs.getInt("stock"), rs.getBoolean("active") }, id);
      if (products.isEmpty() || !(boolean) products.get(0)[3] || (int) products.get(0)[2] < qty) {
        outOfStock.add(map("productId", id, "name", products.isEmpty() ? "Producto" : products.get(0)[0], "available", products.isEmpty() ? 0 : products.get(0)[2]));
      } else {
        long nextSubtotal = (long) subtotal + (long) (int) products.get(0)[1] * qty;
        if (nextSubtotal > Integer.MAX_VALUE) throw new ApiException(HttpStatus.BAD_REQUEST, "El subtotal supera el límite permitido");
        subtotal = (int) nextSubtotal;
      }
    }
    return map("ok", outOfStock.isEmpty(), "outOfStock", outOfStock, "subtotal", subtotal);
  }
  private Map<String, Object> map(Object... values) {
    Map<String, Object> result = new LinkedHashMap<>();
    for (int i = 0; i < values.length; i += 2) result.put((String) values[i], values[i + 1]);
    return result;
  }
  private java.time.OffsetDateTime asOffsetDateTime(Object value) {
    if (value instanceof java.time.OffsetDateTime timestamp) return timestamp;
    if (value instanceof java.sql.Timestamp timestamp) return timestamp.toInstant().atOffset(java.time.ZoneOffset.UTC);
    if (value instanceof java.time.Instant instant) return instant.atOffset(java.time.ZoneOffset.UTC);
    throw new IllegalStateException("Tipo de fecha de promoción no compatible: " + value.getClass().getName());
  }
}

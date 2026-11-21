package co.domiflow.api.service;

import static co.domiflow.api.ApiErrors.ApiException;

import co.domiflow.api.security.UserPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WompiPaymentService {
  private final JdbcTemplate db;
  private final ObjectMapper json;
  private final String environment;
  private final String publicKey;
  private final String integritySecret;
  private final String eventsSecret;
  private final String frontendOrigin;

  public WompiPaymentService(
      JdbcTemplate db,
      ObjectMapper json,
      @Value("${domiflow.wompi.environment:sandbox}") String environment,
      @Value("${domiflow.wompi.public-key:}") String publicKey,
      @Value("${domiflow.wompi.integrity-secret:}") String integritySecret,
      @Value("${domiflow.wompi.events-secret:}") String eventsSecret,
      @Value("${domiflow.cors.allowed-origin:http://localhost:5173}") String frontendOrigin) {
    this.db = db;
    this.json = json;
    this.environment = environment.trim().toLowerCase(Locale.ROOT);
    this.publicKey = publicKey.trim();
    this.integritySecret = integritySecret.trim();
    this.eventsSecret = eventsSecret.trim();
    this.frontendOrigin = frontendOrigin.replaceAll("/+$", "");
  }

  public Map<String, Object> providerStatus() {
    return Map.of("provider", "WOMPI", "environment", environment,
      "configured", !publicKey.isBlank() && !integritySecret.isBlank() && !eventsSecret.isBlank());
  }

  @Transactional
  public Map<String, Object> createCheckout(UserPrincipal customer, UUID orderId) {
    requireCustomer(customer);
    requireCheckoutConfigured();
    Map<String, Object> order;
    try {
      order = db.queryForMap("select o.id,o.code,o.customer_id,o.payment_method,o.total,o.status,o.payment_status,u.name as customer_name,u.email,u.phone,a.street,a.neighborhood,a.city from orders o join app_users u on u.id=o.customer_id left join addresses a on a.id=o.address_id where o.id=? for update of o", orderId);
    } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
      throw fail(HttpStatus.NOT_FOUND, "Pedido no encontrado");
    }
    if (!customer.id().equals(order.get("customer_id"))) throw fail(HttpStatus.NOT_FOUND, "Pedido no encontrado");
    if (!"PENDIENTE".equals(order.get("status")) || "APROBADO".equals(order.get("payment_status"))) {
      throw fail(HttpStatus.CONFLICT, "Este pedido no está disponible para iniciar otro pago");
    }

    int attempt = db.queryForObject("select coalesce(max(attempt_number),0)+1 from payment_attempts where order_id=?", Integer.class, orderId);
    long cents = Math.multiplyExact(((Number) order.get("total")).longValue(), 100L);
    String reference = "DFLOW-" + order.get("code") + "-" + UUID.randomUUID().toString().replace("-", "");
    String signature = sha256(reference + cents + "COP" + integritySecret);
    Map<String, Object> initialResponse = Map.of("provider", "WOMPI", "environment", environment, "status", "PENDING");
    db.update("insert into payment_attempts(order_id,attempt_number,method,amount,status,transaction_reference,provider_response) values(?,?,?,?, 'PENDIENTE',?,?::jsonb)",
      orderId, attempt, order.get("payment_method"), order.get("total"), reference, toJson(initialResponse));
    db.update("insert into payments(order_id,method,amount,status,transaction_reference) values(?,?,?,'PENDIENTE',?) on conflict(order_id) do update set method=excluded.method,amount=excluded.amount,status=excluded.status,transaction_reference=excluded.transaction_reference,updated_at=now()",
      orderId, order.get("payment_method"), order.get("total"), reference);

    Map<String, Object> checkout = new LinkedHashMap<>();
    checkout.put("provider", "WOMPI");
    checkout.put("environment", environment);
    checkout.put("publicKey", publicKey);
    checkout.put("amountInCents", cents);
    checkout.put("currency", "COP");
    checkout.put("reference", reference);
    checkout.put("integritySignature", signature);
    // Wompi's hosted checkout expects a browser-reachable return URL. A local
    // http://localhost URL can be rejected at checkout (CloudFront 403) and is
    // not reachable from the customer's browser after leaving the local app.
    // Omit this optional parameter during local development; configure an
    // HTTPS frontend origin when the app is deployed.
    if (frontendOrigin.startsWith("https://")) {
      checkout.put("redirectUrl", frontendOrigin + "/cliente/pago/" + orderId + "?wompi=return");
    }
    Map<String, Object> customerData = new LinkedHashMap<>();
    customerData.put("email", order.get("email"));
    customerData.put("fullName", order.get("customer_name"));
    String phone = Objects.toString(order.get("phone"), "").trim();
    if (!phone.isBlank()) {
      customerData.put("phoneNumber", phone);
      customerData.put("phoneNumberPrefix", "+57");
    }
    checkout.put("customerData", customerData);
    String street = Objects.toString(order.get("street"), "");
    String neighborhood = Objects.toString(order.get("neighborhood"), "");
    String city = Objects.toString(order.get("city"), "Bogotá");
    if (!street.isBlank() && !phone.isBlank()) {
      checkout.put("shippingAddress", Map.of(
        "addressLine1", street + (neighborhood.isBlank() ? "" : ", " + neighborhood),
        "city", city, "region", "Cundinamarca", "country", "CO", "phoneNumber", phone));
    }
    return checkout;
  }

  @Transactional
  public Map<String, Object> receiveEvent(Map<String, Object> event) {
    if (eventsSecret.isBlank()) throw fail(HttpStatus.SERVICE_UNAVAILABLE, "Wompi Sandbox no está configurado");
    if (!"transaction.updated".equals(event.get("event"))) return Map.of("received", true, "processed", false);
    Map<?, ?> data = asMap(event.get("data"));
    Map<?, ?> transaction = asMap(data.get("transaction"));
    if (!isAuthentic(event, data)) throw fail(HttpStatus.UNAUTHORIZED, "Firma de evento Wompi inválida");

    String reference = Objects.toString(transaction.get("reference"), "");
    String wompiId = Objects.toString(transaction.get("id"), "");
    String rawStatus = Objects.toString(transaction.get("status"), "").toUpperCase(Locale.ROOT);
    long amountCents = parseLong(transaction.get("amount_in_cents"));
    String currency = Objects.toString(transaction.get("currency"), "");
    List<Map<String, Object>> matches = db.queryForList("select pa.id,pa.order_id,pa.attempt_number,pa.amount,o.payment_method,o.total,o.code,o.status as order_status,o.payment_status,o.customer_id,o.merchant_id,(pa.attempt_number=(select max(newer.attempt_number) from payment_attempts newer where newer.order_id=pa.order_id)) as is_latest_attempt from payment_attempts pa join orders o on o.id=pa.order_id where pa.transaction_reference=? for update of pa,o", reference);
    if (matches.isEmpty()) return Map.of("received", true, "processed", false);
    Map<String, Object> payment = matches.get(0);
    if (amountCents != ((Number) payment.get("amount")).longValue() * 100L || !"COP".equals(currency)) {
      throw fail(HttpStatus.BAD_REQUEST, "El monto o moneda del evento Wompi no coincide con el pedido");
    }

    String actualMethod = Objects.toString(transaction.get("payment_method_type"), "").toUpperCase(Locale.ROOT);
    String paymentMethod = switch (actualMethod) {
      case "PSE" -> "PSE";
      case "CARD", "CREDIT_CARD", "DEBIT_CARD" -> "TARJETA";
      default -> Objects.toString(payment.get("payment_method"));
    };
    String status = switch (rawStatus) {
      case "APPROVED" -> "APROBADO";
      case "DECLINED", "VOIDED", "ERROR", "FAILED" -> "RECHAZADO";
      default -> "PENDIENTE";
    };
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("provider", "WOMPI");
    response.put("environment", event.get("environment"));
    response.put("transactionId", wompiId);
    response.put("transactionStatus", rawStatus);
    response.put("paymentMethodType", transaction.get("payment_method_type"));
    response.put("reference", reference);
    response.put("currency", currency);
    response.put("amountInCents", amountCents);
    response.put("timestamp", event.get("timestamp"));
    db.update("update payment_attempts set status=?,method=?,provider_response=?::jsonb where id=?",
      status, paymentMethod, toJson(response), payment.get("id"));

    boolean isApproval = "APROBADO".equals(status);
    boolean updateOrderSummary = isApproval || (Boolean.TRUE.equals(payment.get("is_latest_attempt"))
      && !"APROBADO".equals(payment.get("payment_status")));
    if (updateOrderSummary) {
      db.update("update orders set payment_status=?,payment_method=? where id=?", status, paymentMethod, payment.get("order_id"));
      db.update("insert into payments(order_id,method,amount,status,transaction_reference) values(?,?,?,?,?) on conflict(order_id) do update set method=excluded.method,amount=excluded.amount,status=excluded.status,transaction_reference=excluded.transaction_reference,updated_at=now()",
        payment.get("order_id"), paymentMethod, payment.get("total"), status, reference);
      if ("APROBADO".equals(status) && !"APROBADO".equals(payment.get("payment_status"))) {
        db.update("insert into notifications(user_id,text) values(?,?)", payment.get("customer_id"), "Wompi confirmó el pago de tu pedido");
        UUID merchantOwner = db.queryForObject("select owner_id from merchants where id=?", UUID.class, payment.get("merchant_id"));
        db.update("insert into notifications(user_id,text) values(?,?)", merchantOwner, "Nuevo pedido pagado #" + payment.get("code"));
      }
    }
    return Map.of("received", true, "processed", true);
  }

  private boolean isAuthentic(Map<String, Object> event, Map<?, ?> data) {
    String eventEnvironment = Objects.toString(event.get("environment"), "").toLowerCase(Locale.ROOT);
    if ("sandbox".equals(environment) && !List.of("test", "sandbox").contains(eventEnvironment)) return false;
    if ("production".equals(environment) && !"prod".equals(eventEnvironment)) return false;
    Map<?, ?> signature = asMap(event.get("signature"));
    Object rawProperties = signature.get("properties");
    if (!(rawProperties instanceof List<?> properties) || properties.isEmpty()) return false;
    String timestamp = Objects.toString(event.get("timestamp"), "");
    Object rawChecksum = signature.get("checksum");
    if (rawChecksum == null) return false;
    StringBuilder value = new StringBuilder();
    for (Object path : properties) {
      Object property = resolvePath(data, Objects.toString(path, ""));
      if (property == null) return false;
      value.append(property);
    }
    value.append(timestamp).append(eventsSecret);
    String calculated = sha256(value.toString());
    return MessageDigest.isEqual(calculated.getBytes(StandardCharsets.US_ASCII),
      rawChecksum.toString().toLowerCase(Locale.ROOT).getBytes(StandardCharsets.US_ASCII));
  }

  private Object resolvePath(Map<?, ?> root, String path) {
    Object current = root;
    for (String key : path.split("\\.")) {
      if (!(current instanceof Map<?, ?> map)) return null;
      current = map.get(key);
    }
    return current;
  }

  private Map<?, ?> asMap(Object value) { return value instanceof Map<?, ?> map ? map : Map.of(); }
  private long parseLong(Object value) {
    try { return Long.parseLong(Objects.toString(value)); }
    catch (NumberFormatException ex) { throw fail(HttpStatus.BAD_REQUEST, "Monto de evento Wompi inválido"); }
  }
  private String toJson(Object value) {
    try { return json.writeValueAsString(value); }
    catch (JsonProcessingException ex) { throw fail(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo registrar la respuesta de Wompi"); }
  }
  private String sha256(String value) {
    try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
    catch (NoSuchAlgorithmException ex) { throw new IllegalStateException("SHA-256 no está disponible", ex); }
  }
  private void requireCheckoutConfigured() {
    if (!"sandbox".equals(environment)) throw fail(HttpStatus.SERVICE_UNAVAILABLE, "Esta integración solo está habilitada para Wompi Sandbox");
    if (publicKey.isBlank() || integritySecret.isBlank() || eventsSecret.isBlank()) throw fail(HttpStatus.SERVICE_UNAVAILABLE, "Completa las llaves Wompi Sandbox en backend/.env y reinicia Spring Boot");
  }
  private void requireCustomer(UserPrincipal user) {
    if (!"CLIENTE".equals(user.role())) throw fail(HttpStatus.FORBIDDEN, "Solo un cliente puede pagar un pedido");
  }
  private ApiException fail(HttpStatus status, String message) { return new ApiException(status, message); }
}

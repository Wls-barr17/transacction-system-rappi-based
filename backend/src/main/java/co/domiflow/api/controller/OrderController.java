package co.domiflow.api.controller;

import co.domiflow.api.security.UserPrincipal;
import co.domiflow.api.service.OrderService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class OrderController {
  private final OrderService orders;
  public OrderController(OrderService orders) { this.orders = orders; }
  private UserPrincipal actor(Authentication auth) { return (UserPrincipal) auth.getPrincipal(); }

  @PostMapping("/orders") public Map<String, Object> create(Authentication auth, @RequestBody Map<String, Object> body) { return orders.create(actor(auth), body); }
  @GetMapping("/orders") public List<Map<String, Object>> list(Authentication auth, @RequestParam(required = false) String status) { return orders.list(actor(auth), status); }
  @GetMapping("/orders/{id}") public Map<String, Object> get(Authentication auth, @PathVariable UUID id) { return orders.get(actor(auth), id); }
  @PatchMapping("/orders/{id}/status") public Map<String, Object> updateStatus(Authentication auth, @PathVariable UUID id, @RequestBody Map<String, Object> body) { return orders.changeStatus(actor(auth), id, body.get("status") == null ? "" : body.get("status").toString()); }
  @PostMapping("/orders/{id}/rating") public Map<String, Object> rate(Authentication auth, @PathVariable UUID id, @RequestBody Map<String, Object> body) { return orders.rate(actor(auth), id, body); }
  @PostMapping("/payments/simulate") public Map<String, Object> simulatePayment(Authentication auth, @RequestBody Map<String, Object> body) {
    UUID orderId;
    try { orderId = UUID.fromString(body.get("orderId").toString()); } catch (Exception e) { throw new co.domiflow.api.ApiErrors.ApiException(org.springframework.http.HttpStatus.BAD_REQUEST, "Pedido no válido"); }
    return orders.simulatePayment(actor(auth), orderId, body.get("result") == null ? "" : body.get("result").toString());
  }
}

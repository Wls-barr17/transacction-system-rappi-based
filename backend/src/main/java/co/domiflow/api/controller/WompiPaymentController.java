package co.domiflow.api.controller;

import co.domiflow.api.security.UserPrincipal;
import co.domiflow.api.service.WompiPaymentService;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class WompiPaymentController {
  private final WompiPaymentService payments;
  public WompiPaymentController(WompiPaymentService payments) { this.payments = payments; }

  @GetMapping("/payments/provider")
  public Map<String, Object> provider() { return payments.providerStatus(); }

  @PostMapping("/orders/{orderId}/payments/wompi/session")
  public Map<String, Object> createSession(Authentication authentication, @PathVariable UUID orderId) {
    return payments.createCheckout((UserPrincipal) authentication.getPrincipal(), orderId);
  }

  @PostMapping("/webhooks/wompi")
  public ResponseEntity<Map<String, Object>> receiveEvent(@RequestBody Map<String, Object> event) {
    return ResponseEntity.status(HttpStatus.OK).body(payments.receiveEvent(event));
  }
}

package co.domiflow.api.controller;

import co.domiflow.api.service.CatalogService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CatalogController {
  private final CatalogService catalog;
  public CatalogController(CatalogService catalog) { this.catalog = catalog; }

  @GetMapping("/categories") public List<String> categories() { return catalog.categories(); }
  @GetMapping("/merchants") public List<Map<String, Object>> merchants(@RequestParam(required = false) String category) { return catalog.merchants(category); }
  @GetMapping("/merchants/{id}") public Map<String, Object> merchant(@PathVariable UUID id) { return catalog.merchant(id); }
  @GetMapping("/coupons/validate") public Map<String, Object> coupon(@RequestParam String code, @RequestParam(defaultValue = "0") int subtotal, @RequestParam(required = false) UUID merchantId) { return catalog.coupon(code, subtotal, merchantId); }
  @PostMapping("/cart/validate") public Map<String, Object> validateCart(@RequestBody Map<String, Object> input) { return catalog.validateCart(input); }
}

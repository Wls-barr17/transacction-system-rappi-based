package co.domiflow.api.controller;

import co.domiflow.api.security.UserPrincipal;
import co.domiflow.api.service.AddressService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {
  private final AddressService addresses;
  public AddressController(AddressService addresses) { this.addresses = addresses; }
  private UUID userId(Authentication auth) { return ((UserPrincipal) auth.getPrincipal()).id(); }

  @GetMapping public List<Map<String, Object>> list(Authentication auth) { return addresses.list(userId(auth)); }
  @PostMapping public Map<String, Object> create(Authentication auth, @RequestBody Map<String, Object> input) { return addresses.create(userId(auth), input); }
  @PutMapping("/{id}") public Map<String, Object> update(Authentication auth, @PathVariable UUID id, @RequestBody Map<String, Object> input) { return addresses.update(userId(auth), id, input); }
  @PatchMapping("/{id}/default") public Map<String, Object> makeDefault(Authentication auth, @PathVariable UUID id) { addresses.makeDefault(userId(auth), id); return Map.of("ok", true); }
  @DeleteMapping("/{id}") public Map<String, Object> delete(Authentication auth, @PathVariable UUID id) { addresses.delete(userId(auth), id); return Map.of("ok", true); }
}

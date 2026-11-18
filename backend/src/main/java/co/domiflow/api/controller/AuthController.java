package co.domiflow.api.controller;

import co.domiflow.api.security.UserPrincipal;
import co.domiflow.api.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {
  private final AuthService auth;
  public AuthController(AuthService auth) { this.auth = auth; }

  public record RegisterRequest(@NotBlank @Size(min = 3, max = 120) String name,
                                @NotBlank @Email @Size(max = 254) String email,
                                @NotBlank @Size(min = 8, max = 72) String password,
                                @Size(max = 30) String phone) {}
  public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
  public record ProfileRequest(@NotBlank @Size(min = 3, max = 120) String name,
                               @Size(max = 30) String phone,
                               @Size(max = 2048) String avatarUrl) {}

  @PostMapping("/auth/register") public Map<String, Object> register(@Valid @RequestBody RegisterRequest request) {
    return auth.register(request.name(), request.email(), request.password(), request.phone());
  }
  @PostMapping("/auth/login") public Map<String, Object> login(@Valid @RequestBody LoginRequest request) {
    return auth.login(request.email(), request.password());
  }
  @GetMapping("/auth/me") public Map<String, Object> me(Authentication authentication) {
    return auth.currentUser(((UserPrincipal) authentication.getPrincipal()).id());
  }
  @PutMapping("/profile") public Map<String, Object> updateProfile(Authentication authentication, @Valid @RequestBody ProfileRequest request) {
    return auth.updateProfile(((UserPrincipal) authentication.getPrincipal()).id(), request.name(), request.phone(), request.avatarUrl());
  }
}

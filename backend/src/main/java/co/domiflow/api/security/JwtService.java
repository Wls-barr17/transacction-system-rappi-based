package co.domiflow.api.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final SecretKey key;
  private final long expiryHours;
  public JwtService(@Value("${domiflow.jwt.secret}") String secret, @Value("${domiflow.jwt.expiration-hours:12}") long expiryHours) {
    if (secret.getBytes(StandardCharsets.UTF_8).length < 32) throw new IllegalArgumentException("JWT_SECRET must contain at least 32 bytes");
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); this.expiryHours = expiryHours;
  }
  public String issue(UUID userId, String role) {
    Instant now = Instant.now();
    return Jwts.builder().subject(userId.toString()).claim("role", role).issuedAt(Date.from(now))
      .expiration(Date.from(now.plusSeconds(expiryHours * 3600))).signWith(key).compact();
  }
  public UserPrincipal parse(String token) {
    var claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    return new UserPrincipal(UUID.fromString(claims.getSubject()), claims.get("role", String.class));
  }
}

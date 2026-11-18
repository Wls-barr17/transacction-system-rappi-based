package co.domiflow.api.service;

import static co.domiflow.api.ApiErrors.ApiException;

import co.domiflow.api.security.JwtService;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final JdbcTemplate db;
  private final PasswordEncoder passwords;
  private final JwtService jwt;

  public AuthService(JdbcTemplate db, PasswordEncoder passwords, JwtService jwt) {
    this.db = db;
    this.passwords = passwords;
    this.jwt = jwt;
  }

  @Transactional
  public Map<String, Object> register(String name, String email, String password, String phone) {
    String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
    Integer matches = db.queryForObject("select count(*) from app_users where lower(email)=?", Integer.class, normalizedEmail);
    if (matches != null && matches > 0) throw new ApiException(HttpStatus.CONFLICT, "Ese correo ya está registrado");

    UUID userId = UUID.randomUUID();
    db.update("insert into app_users(id,name,email,phone,password_hash,role) values(?,?,?,?,?,'CLIENTE')",
      userId, name.trim(), normalizedEmail, phone == null ? "" : phone.trim(), passwords.encode(password));
    return session(userId, "CLIENTE");
  }

  public Map<String, Object> login(String email, String password) {
    var matches = db.query("select id,password_hash,role,active from app_users where lower(email)=lower(?)",
      (rs, row) -> new Object[] { rs.getObject("id", UUID.class), rs.getString("password_hash"), rs.getString("role"), rs.getBoolean("active") }, email.trim());
    if (matches.isEmpty() || !passwords.matches(password, (String) matches.get(0)[1]) || !(boolean) matches.get(0)[3]) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos");
    }
    return session((UUID) matches.get(0)[0], (String) matches.get(0)[2]);
  }

  public Map<String, Object> currentUser(UUID userId) {
    return db.queryForMap("select id,name,email,phone,avatar_url as \"avatarUrl\",role,available,active,created_at as \"createdAt\" from app_users where id=? and active=true", userId);
  }

  public Map<String, Object> updateProfile(UUID userId, String name, String phone, String avatarUrl) {
    if (name == null || name.trim().length() < 3) throw new ApiException(HttpStatus.BAD_REQUEST, "Escribe tu nombre completo");
    String image = avatarUrl == null ? "" : avatarUrl.trim();
    if (!image.isEmpty() && (!image.startsWith("https://") || image.length() > 2048)) throw new ApiException(HttpStatus.BAD_REQUEST, "La foto debe usar una URL HTTPS válida");
    db.update("update app_users set name=?,phone=?,avatar_url=? where id=? and active=true", name.trim(), phone == null ? "" : phone.trim(), image, userId);
    return currentUser(userId);
  }

  private Map<String, Object> session(UUID userId, String role) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("token", jwt.issue(userId, role));
    response.put("user", currentUser(userId));
    return response;
  }
}

package co.domiflow.api.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  private final JwtService jwt;
  private final JdbcTemplate db;
  public JwtAuthFilter(JwtService jwt, JdbcTemplate db) { this.jwt = jwt; this.db = db; }
  @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      try {
        UserPrincipal tokenUser = jwt.parse(header.substring(7));
        var rows = db.query("select role from app_users where id=? and active=true", (rs, row) -> rs.getString("role"), tokenUser.id());
        if (rows.isEmpty()) throw new IllegalArgumentException("Usuario inactivo o inexistente");
        UserPrincipal user = new UserPrincipal(tokenUser.id(), rows.get(0));
        var auth = new UsernamePasswordAuthenticationToken(user, null, List.of(new SimpleGrantedAuthority("ROLE_" + user.role())));
        SecurityContextHolder.getContext().setAuthentication(auth);
      } catch (JwtException | IllegalArgumentException ignored) { SecurityContextHolder.clearContext(); }
    }
    chain.doFilter(request, response);
  }
}

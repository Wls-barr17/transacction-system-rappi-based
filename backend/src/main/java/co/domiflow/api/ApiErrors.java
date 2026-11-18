package co.domiflow.api;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

public class ApiErrors {
  public static class ApiException extends RuntimeException {
    public final HttpStatus status;
    public final Map<String, Object> details;
    public ApiException(HttpStatus status, String message) { this(status, message, Map.of()); }
    public ApiException(HttpStatus status, String message, Map<String, Object> details) { super(message); this.status = status; this.details = details; }
  }
  @RestControllerAdvice public static class Handler {
    @ExceptionHandler(ApiException.class) public ResponseEntity<?> api(ApiException e) { Map<String,Object> body=new java.util.LinkedHashMap<>(e.details);body.put("message",e.getMessage());return ResponseEntity.status(e.status).body(body); }
    @ExceptionHandler(org.springframework.dao.EmptyResultDataAccessException.class) public ResponseEntity<?> missing(Exception e) { return ResponseEntity.status(404).body(Map.of("message", "No se encontró el registro solicitado")); }
    @ExceptionHandler(org.springframework.dao.DuplicateKeyException.class) public ResponseEntity<?> duplicate(Exception e) { return ResponseEntity.status(409).body(Map.of("message", "El correo o registro ya existe")); }
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class) public ResponseEntity<?> invalid(Exception e) { return ResponseEntity.badRequest().body(Map.of("message", "Revisa los campos obligatorios")); }
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class) public ResponseEntity<?> malformed(Exception e) { return ResponseEntity.badRequest().body(Map.of("message", "El cuerpo de la solicitud no tiene un formato válido")); }
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class) public ResponseEntity<?> constraint(Exception e) { return ResponseEntity.status(409).body(Map.of("message", "La operación entra en conflicto con datos existentes")); }
  }
}

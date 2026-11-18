package co.domiflow.api.service;

import static co.domiflow.api.ApiErrors.ApiException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AddressService {
  private static final String ADDRESS_COLUMNS = "id,user_id as \"userId\",label,street,city,notes,latitude,longitude,is_default as \"isDefault\"";
  private final JdbcTemplate db;
  public AddressService(JdbcTemplate db) { this.db = db; }

  public List<Map<String, Object>> list(UUID userId) {
    return db.queryForList("select " + ADDRESS_COLUMNS + " from addresses where user_id=? order by is_default desc,created_at", userId);
  }

  @Transactional
  public Map<String, Object> create(UUID userId, Map<String, Object> input) {
    validateAddress(input);
    validateCoordinates(input);
    UUID id = UUID.randomUUID();
    boolean isFirst = db.queryForObject("select count(*) from addresses where user_id=?", Integer.class, userId) == 0;
    db.update("insert into addresses(id,user_id,label,street,city,notes,latitude,longitude,is_default) values(?,?,?,?,?,?,?,?,?)",
      id, userId, input.get("label"), input.get("street"), input.getOrDefault("city", "Bogotá"),
      input.getOrDefault("notes", ""), input.get("latitude"), input.get("longitude"), isFirst);
    return findOwned(userId, id);
  }

  @Transactional
  public Map<String, Object> update(UUID userId, UUID addressId, Map<String, Object> input) {
    validateAddress(input);
    validateCoordinates(input);
    int count = db.update("update addresses set label=?,street=?,city=?,notes=?,latitude=?,longitude=? where id=? and user_id=?",
      input.get("label"), input.get("street"), input.getOrDefault("city", "Bogotá"), input.getOrDefault("notes", ""),
      input.get("latitude"), input.get("longitude"), addressId, userId);
    if (count == 0) throw new ApiException(HttpStatus.NOT_FOUND, "Dirección no encontrada");
    return findOwned(userId, addressId);
  }

  @Transactional
  public void makeDefault(UUID userId, UUID addressId) {
    if (!owned(userId, addressId)) throw new ApiException(HttpStatus.NOT_FOUND, "Dirección no encontrada");
    db.update("update addresses set is_default=false where user_id=? and is_default", userId);
    db.update("update addresses set is_default=true where id=? and user_id=?", addressId, userId);
  }

  @Transactional
  public void delete(UUID userId, UUID addressId) {
    Map<String, Object> address = findOwned(userId, addressId);
    db.update("delete from addresses where id=? and user_id=?", addressId, userId);
    if (Boolean.TRUE.equals(address.get("isDefault"))) {
      db.update("update addresses set is_default=true where id=(select id from addresses where user_id=? order by created_at limit 1) and not exists(select 1 from addresses where user_id=? and is_default)", userId, userId);
    }
  }

  private boolean owned(UUID userId, UUID addressId) {
    return db.queryForObject("select count(*) from addresses where id=? and user_id=?", Integer.class, addressId, userId) > 0;
  }
  private Map<String, Object> findOwned(UUID userId, UUID addressId) {
    try { return db.queryForMap("select " + ADDRESS_COLUMNS + " from addresses where id=? and user_id=?", addressId, userId); }
    catch (org.springframework.dao.EmptyResultDataAccessException e) { throw new ApiException(HttpStatus.NOT_FOUND, "Dirección no encontrada"); }
  }
  private void validateCoordinates(Map<String, Object> input) {
    Object lat = input.get("latitude"), lng = input.get("longitude");
    if ((lat == null) != (lng == null)) throw new ApiException(HttpStatus.BAD_REQUEST, "La ubicación debe incluir latitud y longitud");
    if (lat != null) {
      double latitude, longitude;
      try { latitude = Double.parseDouble(lat.toString()); longitude = Double.parseDouble(lng.toString()); }
      catch (NumberFormatException e) { throw new ApiException(HttpStatus.BAD_REQUEST, "Las coordenadas no son válidas"); }
      if (!Double.isFinite(latitude) || !Double.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Las coordenadas no son válidas");
      }
    }
  }
  private void validateAddress(Map<String, Object> input) {
    for (String field : List.of("label", "street", "city")) {
      Object value = input.get(field);
      if (value == null || value.toString().trim().isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "Completa el nombre, la dirección y la ciudad");
    }
  }
}

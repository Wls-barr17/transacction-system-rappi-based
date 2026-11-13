package co.domiflow.api.security;

import java.util.UUID;

public record UserPrincipal(UUID id, String role) {}

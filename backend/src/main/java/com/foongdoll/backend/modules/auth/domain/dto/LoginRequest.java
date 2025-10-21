package com.foongdoll.backend.modules.auth.domain.dto;

public record LoginRequest(
        String email,
        String password
) {}

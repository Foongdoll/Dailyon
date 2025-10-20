package com.foongdoll.backend.modules.auth.domain.dto;

public record TokenPair(
        String accessToken,
        String refreshToken,
        String tokenType
) {}
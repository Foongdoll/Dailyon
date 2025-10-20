package com.foongdoll.backend.modules.auth.domain.dto;


public record RefreshRequest(
        String refreshToken
) {}
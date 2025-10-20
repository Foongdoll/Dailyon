package com.foongdoll.backend.modules.user.domain.dto;


import java.util.List;

public record UserProfileDto(
        Long id,
        String username,
        String email,
        String nickname,
        List<String> roles,
        boolean enabled
) {}
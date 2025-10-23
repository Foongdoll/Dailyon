package com.foongdoll.backend.modules.user.domain.dto;

public record UserSummaryDto(
        Long id,
        String nickname,
        String email
) {
}

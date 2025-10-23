package com.foongdoll.backend.common.util;

import com.foongdoll.backend.common.error.DailyonException;
import com.foongdoll.backend.common.error.ErrorCode;
import com.foongdoll.backend.security.CustomUserDetails;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails details) {
            return details.getId();
        }
        throw new DailyonException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
    }

    public static String traceId() {
        return MDC.get("traceId");
    }
}

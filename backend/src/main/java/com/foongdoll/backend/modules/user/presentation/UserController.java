package com.foongdoll.backend.modules.user.presentation;


import com.foongdoll.backend.common.api.ApiResponse;
import com.foongdoll.backend.modules.user.application.UserService;
import com.foongdoll.backend.modules.user.domain.dto.UserProfileDto;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** 내 프로필 조회 */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> me(@AuthenticationPrincipal Object principal) {
        UserProfileDto dto = userService.loadMyProfile(principal);
        return ResponseEntity.ok(ApiResponse.ok(dto, MDC.get("traceId")));
    }
}
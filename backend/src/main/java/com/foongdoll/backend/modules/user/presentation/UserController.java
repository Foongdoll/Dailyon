package com.foongdoll.backend.modules.user.presentation;


import com.foongdoll.backend.common.api.ApiResponse;
import com.foongdoll.backend.modules.user.application.UserService;
import com.foongdoll.backend.modules.user.domain.dto.UserProfileDto;
import com.foongdoll.backend.modules.user.domain.dto.UserSummaryDto;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    /** 사용자 검색 (닉네임/이메일) */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Iterable<UserSummaryDto>>> search(@RequestParam String keyword) {
        var results = userService.searchMembers(keyword);
        return ResponseEntity.ok(ApiResponse.ok(results, MDC.get("traceId")));
    }
}

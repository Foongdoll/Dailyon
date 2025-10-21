package com.foongdoll.backend.modules.auth.presentation;


import com.foongdoll.backend.common.api.ApiResponse;
import com.foongdoll.backend.modules.auth.application.AuthService;
import com.foongdoll.backend.modules.auth.domain.dto.LoginRequest;
import com.foongdoll.backend.modules.auth.domain.dto.RefreshRequest;
import com.foongdoll.backend.modules.auth.domain.dto.SignupRequest;
import com.foongdoll.backend.modules.auth.domain.dto.TokenPair;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** 로그인 엔드포인트 */
    @PostMapping("/public/login")
    public ResponseEntity<ApiResponse<TokenPair>> login(@RequestBody LoginRequest request) {
        TokenPair tokenPair = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(tokenPair, MDC.get("traceId")));
    }

    /** 리프레시 토큰 → 새 토큰 페어 발급(간단 회전) */
    @PostMapping("/public/refresh")
    public ResponseEntity<ApiResponse<TokenPair>> refresh(@RequestBody RefreshRequest request) {
        TokenPair tokenPair = authService.refresh(request.refreshToken());
        return ResponseEntity.ok(ApiResponse.ok(tokenPair, MDC.get("traceId")));
    }

    /** 회원가입 엔드포인트 */
    @PostMapping("/public/signup")
    public ResponseEntity<ApiResponse<TokenPair>> signup(@RequestBody SignupRequest request) {
        TokenPair tokenPair = authService.signup(request);
        return ResponseEntity.ok(ApiResponse.ok(tokenPair, MDC.get("traceId")));
    }

}

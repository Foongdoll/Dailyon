package com.foongdoll.backend.modules.auth.application;


import com.foongdoll.backend.common.api.LoginFailedException;
import com.foongdoll.backend.common.error.DailyonException;
import com.foongdoll.backend.common.error.ErrorCode;
import com.foongdoll.backend.modules.auth.domain.dto.LoginRequest;
import com.foongdoll.backend.modules.auth.domain.dto.SignupRequest;
import com.foongdoll.backend.modules.auth.domain.dto.TokenPair;
import com.foongdoll.backend.modules.user.domain.User;
import com.foongdoll.backend.modules.user.domain.UserRepository;
import com.foongdoll.backend.security.JwtTokenProvider;
import com.foongdoll.backend.security.Role;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwt;

    public TokenPair login(LoginRequest req) {
        User user = userRepository.findByUsername(req.email())
                .orElseThrow(() ->
                        new LoginFailedException("아이디 혹은 비밀번호를 확인해주세요.")
                );

        if (!user.isEnabled() || !passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new LoginFailedException("아이디 혹은 비밀번호를 확인해주세요.");
        }


        Set<Role> roles = user.getRoles();
        String access = jwt.generateAccessToken(user.getId(), user.getUsername(), roles);
        String refresh = jwt.generateRefreshToken(user.getId(), user.getUsername());
        return new TokenPair(access, refresh, "Bearer");
    }

    public TokenPair refresh(String refreshToken) {
        if (!jwt.validate(refreshToken)) {
            throw new DailyonException(ErrorCode.UNAUTHORIZED, "Invalid refresh token");
        }

        Long userId = jwt.getUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new DailyonException(ErrorCode.UNAUTHORIZED, "User not found"));

        String newAccess = jwt.generateAccessToken(user.getId(), user.getUsername(), user.getRoles());
        String newRefresh = jwt.generateRefreshToken(user.getId(), user.getUsername()); // 간단 회전(실전은 저장소 관리 권장)
        return new TokenPair(newAccess, newRefresh, "Bearer");
    }

    public TokenPair signup(SignupRequest req) {
        Optional<User> user = userRepository.findByUsername(req.getEmail());
        if(user.isPresent()) {
            throw new DailyonException(ErrorCode.UNAUTHORIZED, "Username already exists");
        }

        Set<Role> set = new HashSet<>();
        set.add(Role.USER);
        User u = userRepository.save(User.builder()
                .username(req.getEmail())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .nickname(req.getNickname())
                        .roles(set)
                .enabled(true)
                .build());

        String access = jwt.generateAccessToken(u.getId(), u.getUsername(), u.getRoles());
        String refresh = jwt.generateRefreshToken(u.getId(), u.getUsername());
        return new TokenPair(access, refresh, "Bearer");
    }
}
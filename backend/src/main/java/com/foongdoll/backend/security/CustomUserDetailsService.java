package com.foongdoll.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Set;

/**
 * 실제로는 UserRepository에서 조회하도록 연결.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserQueryPort userQueryPort; // 포트(인터페이스) 주입

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // username: 이메일 또는 로그인 아이디
        return userQueryPort.findByUsername(username)
                .map(u -> CustomUserDetails.builder()
                        .id(u.id())
                        .username(u.username())
                        .password(u.encodedPassword())
                        .nickname(u.nickName())
                        .roles(u.roles())
                        .enabled(u.enabled())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    // ==== Port & DTO (도메인 의존성 없이 간단히 정의) ====
    public interface UserQueryPort {
        Optional<UserView> findByUsername(String username);

    }
    public record UserView(Long id, String username, String encodedPassword, String nickName, Set<Role> roles, boolean enabled) {}
}
package com.foongdoll.backend.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties props;
    private final CustomUserDetailsService userDetailsService;
    private final ObjectMapper objectMapper;

    private Key signingKey;

    @PostConstruct
    void init() {
        this.signingKey = Keys.hmacShaKeyFor(props.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(Long userId, String username, Set<Role> roles) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(props.getAccessTokenValiditySeconds());

        Map<String, Object> claims = new HashMap<>();
        claims.put("uid", userId);
        claims.put("roles", roles.stream().map(Enum::name).toList());

        return Jwts.builder()
                .setIssuer(props.getIssuer())
                .setSubject(username)
                .addClaims(claims)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(Long userId, String username) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(props.getRefreshTokenValiditySeconds());

        return Jwts.builder()
                .setIssuer(props.getIssuer())
                .setSubject(username)
                .claim("uid", userId)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validate(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Authentication getAuthentication(String token) {
        Claims claims = parseClaims(token);
        String username = claims.getSubject();

        // roles 파싱
        Set<Role> roles = extractRoles(claims);

        var user = (CustomUserDetails) userDetailsService.loadUserByUsername(username);
        // 토큰의 roles와 DB의 roles가 다를 수 있는데, 운영에서는 DB 기준을 권장.
        // 여기선 user(=DB) 기준으로 Authentication 생성.
        return new UsernamePasswordAuthenticationToken(user, token, user.getAuthorities());
    }

    public Long getUserId(String token) {
        return parseClaims(token).get("uid", Number.class).longValue();
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .requireIssuer(props.getIssuer())
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Set<Role> extractRoles(Claims claims) {
        Object raw = claims.get("roles");
        if (raw == null) return Set.of();
        try {
            List<String> list = objectMapper.convertValue(raw, new TypeReference<List<String>>() {});
            return list.stream().map(Role::valueOf).collect(Collectors.toSet());
        } catch (Exception e) {
            return Set.of();
        }
    }
}
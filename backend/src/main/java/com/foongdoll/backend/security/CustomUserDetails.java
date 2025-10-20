package com.foongdoll.backend.security;

import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;
import java.util.stream.Collectors;

@Getter
public class CustomUserDetails implements UserDetails {
    private final Long id;
    private final String username;     // email or login id
    private final String password;
    private final String nickname;
    private final Set<Role> roles;
    private final boolean enabled;

    @Builder
    public CustomUserDetails(Long id, String username, String password, String nickname, Set<Role> roles, boolean enabled) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.nickname = nickname;
        this.roles = roles == null ? Set.of(Role.USER) : roles;
        this.enabled = enabled;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(r -> (GrantedAuthority) r::asAuthority)
                .collect(Collectors.toUnmodifiableSet());
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
}
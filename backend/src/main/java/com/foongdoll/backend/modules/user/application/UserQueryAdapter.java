package com.foongdoll.backend.modules.user.application;
import com.foongdoll.backend.modules.user.domain.UserRepository;
import com.foongdoll.backend.security.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserQueryAdapter implements CustomUserDetailsService.UserQueryPort {

    private final UserRepository userRepository;

    @Override
    public Optional<CustomUserDetailsService.UserView> findByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(u -> new CustomUserDetailsService.UserView(
                        u.getId(),
                        u.getUsername(),
                        u.getPassword(),
                        u.getNickname(),
                        u.getRoles(),
                        u.isEnabled()
                ));
    }
}

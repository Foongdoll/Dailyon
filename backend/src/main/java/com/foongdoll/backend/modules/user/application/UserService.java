package com.foongdoll.backend.modules.user.application;

import com.foongdoll.backend.modules.user.domain.User;
import com.foongdoll.backend.modules.user.domain.UserRepository;
import com.foongdoll.backend.modules.user.domain.dto.UserProfileDto;
import com.foongdoll.backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserProfileDto loadMyProfile(Object principal) {
        if (principal instanceof CustomUserDetails cud) {
            User u = userRepository.findById(cud.getId()).orElseThrow();
            return new UserProfileDto(
                    u.getId(),
                    u.getUsername(),
                    u.getEmail(),
                    u.getNickname(),
                    u.getRoles().stream().map(Enum::name).toList(),
                    u.isEnabled()
            );
        }
        throw new IllegalStateException("Unauthenticated");
    }
}
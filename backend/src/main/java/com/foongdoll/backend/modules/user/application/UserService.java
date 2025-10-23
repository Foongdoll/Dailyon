package com.foongdoll.backend.modules.user.application;

import com.foongdoll.backend.modules.user.domain.User;
import com.foongdoll.backend.modules.user.domain.UserRepository;
import com.foongdoll.backend.modules.user.domain.dto.UserProfileDto;
import com.foongdoll.backend.modules.user.domain.dto.UserSummaryDto;
import com.foongdoll.backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

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

    public List<UserSummaryDto> searchMembers(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return List.of();
        }
        return userRepository
                .findTop10ByNicknameContainingIgnoreCaseOrEmailContainingIgnoreCase(keyword, keyword)
                .stream()
                .map(user -> new UserSummaryDto(user.getId(), user.getNickname(), user.getEmail()))
                .toList();
    }
}

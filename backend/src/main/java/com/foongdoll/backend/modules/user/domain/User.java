package com.foongdoll.backend.modules.user.domain;
import com.foongdoll.backend.common.audit.Auditable;
import com.foongdoll.backend.security.Role;
import jakarta.persistence.*;
import lombok.*;

import java.util.EnumSet;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_users_username", columnNames = {"username"}),
                @UniqueConstraint(name = "uk_users_email", columnNames = {"email"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    /** 로그인 ID (이메일과 별개로 운용 가능) */
    @Column(nullable = false, length = 80)
    private String username;

    /** 로그인/연락용 이메일 */
    @Column(nullable = false, length = 150)
    private String email;

    /** BCrypt 등으로 인코딩된 비밀번호 */
    @Column(nullable = false, length = 200)
    private String password;

    /** 닉네임 (추가됨) */
    @Column(name = "nickname", length = 50)
    private String nickname;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20, nullable = false)
    private Set<Role> roles = EnumSet.of(Role.USER);

    @Column(nullable = false)
    private boolean enabled = true;

    // 편의 메서드
    public void addRole(Role role) {
        if (roles == null) roles = EnumSet.noneOf(Role.class);
        roles.add(role);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() { return Objects.hashCode(id); }
}
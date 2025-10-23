package com.foongdoll.backend.modules.ledger.domain;

import com.foongdoll.backend.modules.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "sheet")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sheet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 시트 ID

    @ManyToOne(fetch = FetchType.LAZY, optional = false)   // ★ 소유자
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 100)
    private String title; // 시트 제목

    @Column(columnDefinition = "TEXT")
    private String description; // 시트 설명

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SheetOrientation orientation = SheetOrientation.LANDSCAPE;

    @Builder.Default
    @Column(nullable = false)
    private Integer rowCount = 40;

    @Builder.Default
    @Column(nullable = false)
    private Integer columnCount = 26;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // 양방향 매핑 (Cascade로 셀도 함께 저장/삭제)
    @OneToMany(mappedBy = "sheet", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SheetCell> cells;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

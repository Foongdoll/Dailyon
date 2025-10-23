package com.foongdoll.backend.modules.note.domain;

import com.foongdoll.backend.common.audit.Auditable;
import com.foongdoll.backend.modules.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "note_categories",
        uniqueConstraints = @UniqueConstraint(name = "uk_note_category_owner_name", columnNames = {"owner_id", "name"})
)
@Entity
public class NoteCategory extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false, foreignKey = @ForeignKey(name = "fk_note_category_owner"))
    private User owner;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 400)
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "note_category_fields",
            joinColumns = @JoinColumn(name = "category_id")
    )
    private List<NoteCategoryField> fields = new ArrayList<>();

    @Builder
    private NoteCategory(User owner, String name, String description, List<NoteCategoryField> fields) {
        this.owner = Objects.requireNonNull(owner, "owner must not be null");
        this.name = Objects.requireNonNull(name, "category name must not be null");
        this.description = description;
        if (fields != null) {
            this.fields.addAll(fields);
        }
    }

    public void update(String name, String description, List<NoteCategoryField> fields) {
        if (name != null && !name.isBlank()) {
            this.name = name;
        }
        this.description = description;
        if (fields != null) {
            this.fields.clear();
            this.fields.addAll(fields);
        }
    }

    public List<NoteCategoryField> getFieldsSorted() {
        return fields.stream()
                .sorted(Comparator.comparingInt(NoteCategoryField::getOrderIndex))
                .toList();
    }
}

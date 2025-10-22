package com.foongdoll.backend.modules.note.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Objects;

@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteCategoryField {

    @Column(name = "field_key", nullable = false, length = 60)
    private String key;

    @Column(name = "field_label", nullable = false, length = 120)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(name = "field_type", nullable = false, length = 30)
    private NoteFieldType type;

    @Column(name = "field_required", nullable = false)
    private boolean required;

    @Column(name = "field_order", nullable = false)
    private int orderIndex;

    public void update(String label, NoteFieldType type, boolean required, int orderIndex) {
        if (label != null && !label.isBlank()) {
            this.label = label;
        }
        if (type != null) {
            this.type = type;
        }
        this.required = required;
        this.orderIndex = orderIndex;
    }

    public String getKey() {
        return key;
    }

    public int getOrderIndex() {
        return orderIndex;
    }

    public static NoteCategoryField of(String key, String label, NoteFieldType type, boolean required, int order) {
        Objects.requireNonNull(key, "field key must not be null");
        Objects.requireNonNull(label, "field label must not be null");
        Objects.requireNonNull(type, "field type must not be null");
        return NoteCategoryField.builder()
                .key(key.trim())
                .label(label.trim())
                .type(type)
                .required(required)
                .orderIndex(order)
                .build();
    }
}

package com.foongdoll.backend.modules.note.presentation.dto;

import com.foongdoll.backend.modules.note.domain.NoteCategory;
import com.foongdoll.backend.modules.note.domain.NoteCategoryField;
import com.foongdoll.backend.modules.note.domain.NoteFieldType;

import java.util.List;

public final class CategoryDtos {

    private CategoryDtos() {
    }

    public record CategoryFieldPayload(
            String key,
            String label,
            NoteFieldType type,
            boolean required,
            int orderIndex
    ) {
    }

    public record CategoryRequest(
            String name,
            String description,
            List<CategoryFieldPayload> fields
    ) {
    }

    public record CategoryResponse(
            Long id,
            String name,
            String description,
            List<CategoryFieldPayload> fields
    ) {
        public static CategoryResponse from(NoteCategory category) {
            List<CategoryFieldPayload> fieldDtos = category.getFieldsSorted().stream()
                    .map(field -> new CategoryFieldPayload(
                            field.getKey(),
                            field.getLabel(),
                            field.getType(),
                            field.isRequired(),
                            field.getOrderIndex()
                    ))
                    .toList();
            return new CategoryResponse(
                    category.getId(),
                    category.getName(),
                    category.getDescription(),
                    fieldDtos
            );
        }
    }

    public static List<NoteCategoryField> toFields(List<CategoryFieldPayload> payloads) {
        if (payloads == null) {
            return List.of();
        }
        return payloads.stream()
                .map(p -> NoteCategoryField.of(p.key(), p.label(), p.type(), p.required(), p.orderIndex()))
                .toList();
    }
}

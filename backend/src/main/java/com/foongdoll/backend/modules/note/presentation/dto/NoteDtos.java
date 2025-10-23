package com.foongdoll.backend.modules.note.presentation.dto;

import com.foongdoll.backend.modules.note.domain.Note;
import com.foongdoll.backend.modules.note.domain.NoteLayout;

import java.util.List;
import java.util.Map;

public final class NoteDtos {

    private NoteDtos() {
    }

    public record NoteLayoutPayload(int x, int y, int width, int height) {
        public NoteLayout toLayout() {
            return NoteLayout.builder()
                    .x(x)
                    .y(y)
                    .width(width)
                    .height(height)
                    .build();
        }

        public static NoteLayoutPayload from(NoteLayout layout) {
            if (layout == null) {
                return new NoteLayoutPayload(0, 0, 4, 3);
            }
            return new NoteLayoutPayload(layout.getX(), layout.getY(), layout.getWidth(), layout.getHeight());
        }
    }

    public record NoteUpsertRequest(
            Long categoryId,
            String title,
            String content,
            String color,
            boolean pinned,
            List<String> tags,
            Map<String, Object> fields,
            NoteLayoutPayload layout
    ) {
    }

    public record NoteResponse(
            Long id,
            Long categoryId,
            String categoryName,
            String title,
            String content,
            String color,
            boolean pinned,
            List<String> tags,
            Map<String, Object> fields,
            NoteLayoutPayload layout,
            double position,
            String createdAt,
            String updatedAt
    ) {
        public static NoteResponse from(Note note) {
            return new NoteResponse(
                    note.getId(),
                    note.getCategory().getId(),
                    note.getCategory().getName(),
                    note.getTitle(),
                    note.getContent(),
                    note.getColor(),
                    note.isPinned(),
                    List.copyOf(note.getTags()),
                    note.getData(),
                    NoteLayoutPayload.from(note.getLayout()),
                    note.getPositionIndex(),
                    note.getCreatedAt() == null ? null : note.getCreatedAt().toString(),
                    note.getUpdatedAt() == null ? null : note.getUpdatedAt().toString()
            );
        }
    }

    public record NotePageResponse(
            List<NoteResponse> notes,
            long totalElements,
            int totalPages,
            int page
    ) {
        public static NotePageResponse from(org.springframework.data.domain.Page<Note> page) {
            List<NoteResponse> responses = page.getContent().stream()
                    .map(NoteResponse::from)
                    .toList();
            return new NotePageResponse(responses, page.getTotalElements(), page.getTotalPages(), page.getNumber());
        }
    }

    public record LayoutUpdateRequest(
            Long noteId,
            double position,
            NoteLayoutPayload layout
    ) {
    }
}

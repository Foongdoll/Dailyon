package com.foongdoll.backend.modules.note.presentation;

import com.foongdoll.backend.common.api.ApiResponse;
import com.foongdoll.backend.common.error.DailyonException;
import com.foongdoll.backend.common.error.ErrorCode;
import com.foongdoll.backend.common.util.SecurityUtils;
import com.foongdoll.backend.modules.note.application.NoteService;
import com.foongdoll.backend.modules.note.presentation.dto.NoteDtos;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    public ApiResponse<NoteDtos.NotePageResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<com.foongdoll.backend.modules.note.domain.Note> result =
                noteService.search(requireUserId(), categoryId, keyword, pageable);
        return ApiResponse.ok(NoteDtos.NotePageResponse.from(result), traceId());
    }

    @GetMapping("/{noteId}")
    public ApiResponse<NoteDtos.NoteResponse> detail(@PathVariable Long noteId) {
        var note = noteService.get(requireUserId(), noteId);
        return ApiResponse.ok(NoteDtos.NoteResponse.from(note), traceId());
    }

    @PostMapping
    public ApiResponse<NoteDtos.NoteResponse> create(@RequestBody NoteDtos.NoteUpsertRequest request) {
        var note = noteService.create(requireUserId(), request);
        return ApiResponse.ok(NoteDtos.NoteResponse.from(note), traceId());
    }

    @PutMapping("/{noteId}")
    public ApiResponse<NoteDtos.NoteResponse> update(
            @PathVariable Long noteId,
            @RequestBody NoteDtos.NoteUpsertRequest request
    ) {
        var note = noteService.update(requireUserId(), noteId, request);
        return ApiResponse.ok(NoteDtos.NoteResponse.from(note), traceId());
    }

    @DeleteMapping("/{noteId}")
    public ApiResponse<Void> delete(@PathVariable Long noteId) {
        noteService.delete(requireUserId(), noteId);
        return ApiResponse.ok(traceId());
    }

    @PatchMapping("/layout")
    public ApiResponse<Void> updateLayout(@RequestBody List<NoteDtos.LayoutUpdateRequest> requests) {
        noteService.updateLayouts(requireUserId(), requests);
        return ApiResponse.ok(traceId());
    }

    private Long requireUserId() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new DailyonException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return userId;
    }

    private String traceId() {
        return MDC.get("traceId");
    }
}

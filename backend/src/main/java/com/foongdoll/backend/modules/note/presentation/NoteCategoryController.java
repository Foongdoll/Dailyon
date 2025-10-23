package com.foongdoll.backend.modules.note.presentation;

import com.foongdoll.backend.common.api.ApiResponse;
import com.foongdoll.backend.common.error.DailyonException;
import com.foongdoll.backend.common.error.ErrorCode;
import com.foongdoll.backend.common.util.SecurityUtils;
import com.foongdoll.backend.modules.note.application.NoteCategoryService;
import com.foongdoll.backend.modules.note.presentation.dto.CategoryDtos;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes/categories")
@RequiredArgsConstructor
public class NoteCategoryController {

    private final NoteCategoryService categoryService;

    @GetMapping
    public ApiResponse<List<CategoryDtos.CategoryResponse>> list() {
        Long userId = requireUserId();
        var categories = categoryService.list(userId).stream()
                .map(CategoryDtos.CategoryResponse::from)
                .toList();
        return ApiResponse.ok(categories, traceId());
    }

    @PostMapping
    public ApiResponse<CategoryDtos.CategoryResponse> create(@RequestBody CategoryDtos.CategoryRequest request) {
        Long userId = requireUserId();
        var category = categoryService.create(userId, request);
        return ApiResponse.ok(CategoryDtos.CategoryResponse.from(category), traceId());
    }

    @PutMapping("/{categoryId}")
    public ApiResponse<CategoryDtos.CategoryResponse> update(
            @PathVariable Long categoryId,
            @RequestBody CategoryDtos.CategoryRequest request
    ) {
        Long userId = requireUserId();
        var category = categoryService.update(userId, categoryId, request);
        return ApiResponse.ok(CategoryDtos.CategoryResponse.from(category), traceId());
    }

    @DeleteMapping("/{categoryId}")
    public ApiResponse<Void> delete(@PathVariable Long categoryId) {
        Long userId = requireUserId();
        categoryService.delete(userId, categoryId);
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

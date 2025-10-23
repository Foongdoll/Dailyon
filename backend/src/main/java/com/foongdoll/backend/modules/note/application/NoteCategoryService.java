package com.foongdoll.backend.modules.note.application;

import com.foongdoll.backend.common.error.DailyonException;
import com.foongdoll.backend.common.error.ErrorCode;
import com.foongdoll.backend.modules.note.domain.NoteCategory;
import com.foongdoll.backend.modules.note.domain.NoteCategoryRepository;
import com.foongdoll.backend.modules.note.domain.NoteRepository;
import com.foongdoll.backend.modules.note.presentation.dto.CategoryDtos;
import com.foongdoll.backend.modules.user.domain.User;
import com.foongdoll.backend.modules.user.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteCategoryService {

    private final NoteCategoryRepository categoryRepository;
    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    public List<NoteCategory> list(Long userId) {
        return categoryRepository.findByOwnerIdOrderByNameAsc(userId);
    }

    @Transactional
    public NoteCategory create(Long userId, CategoryDtos.CategoryRequest request) {
        validateCategoryName(userId, request.name());
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new DailyonException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다."));

        NoteCategory category = NoteCategory.builder()
                .owner(owner)
                .name(request.name())
                .description(request.description())
                .fields(CategoryDtos.toFields(request.fields()))
                .build();

        return categoryRepository.save(category);
    }

    @Transactional
    public NoteCategory update(Long userId, Long categoryId, CategoryDtos.CategoryRequest request) {
        NoteCategory category = categoryRepository.findByIdAndOwnerId(categoryId, userId)
                .orElseThrow(() -> new DailyonException(ErrorCode.NOT_FOUND, "카테고리를 찾을 수 없습니다."));

        if (!category.getName().equalsIgnoreCase(request.name())) {
            validateCategoryName(userId, request.name());
        }

        category.update(request.name(), request.description(), CategoryDtos.toFields(request.fields()));
        return category;
    }

    @Transactional
    public void delete(Long userId, Long categoryId) {
        NoteCategory category = categoryRepository.findByIdAndOwnerId(categoryId, userId)
                .orElseThrow(() -> new DailyonException(ErrorCode.NOT_FOUND, "카테고리를 찾을 수 없습니다."));
        if (noteRepository.existsByAuthorIdAndCategoryId(userId, categoryId)) {
            throw new DailyonException(ErrorCode.CONFLICT, "해당 카테고리에 작성된 노트가 있어 삭제할 수 없습니다.");
        }
        categoryRepository.delete(category);
    }

    private void validateCategoryName(Long userId, String name) {
        if (name == null || name.isBlank()) {
            throw new DailyonException(ErrorCode.VALIDATION_ERROR, "카테고리 이름을 입력해주세요.");
        }
        if (categoryRepository.existsByOwnerIdAndNameIgnoreCase(userId, name)) {
            throw new DailyonException(ErrorCode.CONFLICT, "이미 존재하는 카테고리 이름입니다.");
        }
    }
}

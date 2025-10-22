package com.foongdoll.backend.modules.note.application;

import com.foongdoll.backend.common.error.DailyonException;
import com.foongdoll.backend.common.error.ErrorCode;
import com.foongdoll.backend.modules.note.domain.Note;
import com.foongdoll.backend.modules.note.domain.NoteCategory;
import com.foongdoll.backend.modules.note.domain.NoteCategoryField;
import com.foongdoll.backend.modules.note.domain.NoteCategoryRepository;
import com.foongdoll.backend.modules.note.domain.NoteFieldType;
import com.foongdoll.backend.modules.note.domain.NoteLayout;
import com.foongdoll.backend.modules.note.domain.NoteRepository;
import com.foongdoll.backend.modules.note.presentation.dto.NoteDtos;
import com.foongdoll.backend.modules.user.domain.User;
import com.foongdoll.backend.modules.user.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteService {

    private final NoteRepository noteRepository;
    private final NoteCategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public Page<Note> search(Long userId, Long categoryId, String keyword, Pageable pageable) {
        return noteRepository.search(userId, categoryId, normalizeKeyword(keyword), pageable);
    }

    @Transactional
    public Note create(Long userId, NoteDtos.NoteUpsertRequest request) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new DailyonException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        NoteCategory category = loadCategory(userId, request.categoryId());

        Map<String, Object> prepared = prepareFieldValues(category, request.fields());
        double nextPosition = noteRepository.findMaxPositionIndex(userId) + 1d;
        NoteLayout layout = request.layout() == null ? NoteLayout.defaultLayout() : request.layout().toLayout();

        Note note = Note.builder()
                .author(author)
                .category(category)
                .title(request.title())
                .content(request.content())
                .color(request.color())
                .pinned(request.pinned())
                .tags(request.tags())
                .data(prepared)
                .layout(layout)
                .positionIndex(nextPosition)
                .build();

        return noteRepository.save(note);
    }

    @Transactional
    public Note update(Long userId, Long noteId, NoteDtos.NoteUpsertRequest request) {
        Note note = getNoteOwnedBy(userId, noteId);
        if (!note.getCategory().getId().equals(request.categoryId())) {
            NoteCategory newCategory = loadCategory(userId, request.categoryId());
            note.changeCategory(newCategory);
        }

        Map<String, Object> prepared = prepareFieldValues(note.getCategory(), request.fields());
        note.update(request.title(), request.content(), request.color(), request.pinned(), request.tags(), prepared);

        if (request.layout() != null) {
            note.applyLayout(request.layout().toLayout(), note.getPositionIndex());
        }
        return note;
    }

    @Transactional
    public void delete(Long userId, Long noteId) {
        Note note = getNoteOwnedBy(userId, noteId);
        noteRepository.delete(note);
    }

    @Transactional
    public void updateLayouts(Long userId, List<NoteDtos.LayoutUpdateRequest> requests) {
        Set<Long> ids = requests.stream()
                .map(NoteDtos.LayoutUpdateRequest::noteId)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) return;

        List<Note> notes = noteRepository.findAllById(ids);
        Map<Long, Note> noteMap = notes.stream().collect(Collectors.toMap(Note::getId, it -> it));

        for (NoteDtos.LayoutUpdateRequest payload : requests) {
            Note note = noteMap.get(payload.noteId());
            if (note == null || !note.getAuthor().getId().equals(userId)) {
                throw new DailyonException(ErrorCode.FORBIDDEN, "배치 권한이 없습니다.");
            }
            NoteLayout layout = payload.layout() == null ? note.getLayout() : payload.layout().toLayout();
            note.applyLayout(layout, payload.position());
        }
    }

    public Note get(Long userId, Long noteId) {
        return getNoteOwnedBy(userId, noteId);
    }

    private NoteCategory loadCategory(Long userId, Long categoryId) {
        if (categoryId == null) {
            throw new DailyonException(ErrorCode.VALIDATION_ERROR, "카테고리를 선택해주세요.");
        }
        return categoryRepository.findByIdAndOwnerId(categoryId, userId)
                .orElseThrow(() -> new DailyonException(ErrorCode.NOT_FOUND, "카테고리를 찾을 수 없습니다."));
    }

    private Note getNoteOwnedBy(Long userId, Long noteId) {
        return noteRepository.findById(noteId)
                .filter(note -> note.getAuthor().getId().equals(userId))
                .orElseThrow(() -> new DailyonException(ErrorCode.NOT_FOUND, "노트를 찾을 수 없습니다."));
    }

    private Map<String, Object> prepareFieldValues(NoteCategory category, Map<String, Object> fields) {
        Map<String, Object> input = fields == null ? Map.of() : fields;
        Map<String, Object> normalized = new LinkedHashMap<>();

        for (NoteCategoryField schema : category.getFieldsSorted()) {
            Object value = input.get(schema.getKey());
            if (value == null || (value instanceof String str && str.isBlank())) {
                if (schema.isRequired()) {
                    throw new DailyonException(ErrorCode.VALIDATION_ERROR, schema.getLabel() + " 값을 입력해주세요.");
                }
                continue;
            }
            normalized.put(schema.getKey(), normalizeValue(schema, value));
        }

        return normalized;
    }

    private Object normalizeValue(NoteCategoryField field, Object value) {
        return switch (field.getType()) {
            case NUMBER -> parseNumber(field, value);
            case BOOLEAN -> parseBoolean(value);
            case DATE -> parseDate(value);
            case TAGS -> parseTags(value);
            case TEXT -> value.toString();
        };
    }

    private Double parseNumber(NoteCategoryField field, Object value) {
        try {
            if (value instanceof Number number) {
                return number.doubleValue();
            }
            return Double.parseDouble(value.toString().trim());
        } catch (NumberFormatException ex) {
            throw new DailyonException(ErrorCode.VALIDATION_ERROR, field.getLabel() + "은(는) 숫자 형식이어야 합니다.");
        }
    }

    private Boolean parseBoolean(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        String str = value.toString().trim().toLowerCase();
        return str.equals("1") || str.equals("true") || str.equals("yes") || str.equals("y");
    }

    private String parseDate(Object value) {
        String str = value.toString().trim();
        try {
            LocalDate.parse(str);
            return str;
        } catch (DateTimeParseException ex) {
            throw new DailyonException(ErrorCode.VALIDATION_ERROR, "날짜 형식(yyyy-MM-dd)이 올바르지 않습니다.");
        }
    }

    private List<String> parseTags(Object value) {
        if (value instanceof List<?> list) {
            return list.stream().map(Object::toString).map(String::trim).filter(it -> !it.isEmpty()).toList();
        }
        String[] tokens = value.toString().split(",");
        return java.util.Arrays.stream(tokens)
                .map(String::trim)
                .filter(token -> !token.isEmpty())
                .toList();
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        return keyword;
    }
}

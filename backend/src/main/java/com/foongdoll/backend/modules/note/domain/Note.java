package com.foongdoll.backend.modules.note.domain;

import com.foongdoll.backend.common.audit.Auditable;
import com.foongdoll.backend.common.util.JsonUtils;
import com.foongdoll.backend.modules.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "notes",
        indexes = {
                @Index(name = "idx_notes_author", columnList = "author_id"),
                @Index(name = "idx_notes_category", columnList = "category_id")
        }
)
@Entity
public class Note extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "note_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false, foreignKey = @ForeignKey(name = "fk_note_author"))
    private User author;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false, foreignKey = @ForeignKey(name = "fk_note_category"))
    private NoteCategory category;

    @Column(nullable = false, length = 160)
    private String title;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(length = 30)
    private String color;

    @Column(name = "is_pinned", nullable = false)
    private boolean pinned;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "note_tags", joinColumns = @JoinColumn(name = "note_id"))
    @Column(name = "tag_value", length = 40, nullable = false)
    private List<String> tags = new ArrayList<>();

    @Embedded
    private NoteLayout layout = NoteLayout.defaultLayout();

    @Column(name = "position_index", nullable = false)
    private double positionIndex;

    @Column(name = "data_json", columnDefinition = "LONGTEXT", nullable = false)
    private String dataJson = "{}";

    @Transient
    private Map<String, Object> data = new LinkedHashMap<>();

    @Builder
    private Note(User author,
                 NoteCategory category,
                 String title,
                 String content,
                 String color,
                 boolean pinned,
                 List<String> tags,
                 Map<String, Object> data,
                 NoteLayout layout,
                 double positionIndex) {
        this.author = Objects.requireNonNull(author, "author must not be null");
        this.category = Objects.requireNonNull(category, "category must not be null");
        this.title = Objects.requireNonNull(title, "title must not be null");
        this.content = content;
        this.color = color;
        this.pinned = pinned;
        if (tags != null) {
            this.tags.addAll(tags.stream().map(String::trim).filter(s -> !s.isEmpty()).toList());
        }
        setData(data);
        this.layout = layout == null ? NoteLayout.defaultLayout() : layout;
        this.positionIndex = positionIndex;
    }

    public void update(String title,
                       String content,
                       String color,
                       boolean pinned,
                       List<String> tags,
                       Map<String, Object> data) {
        if (title != null && !title.isBlank()) {
            this.title = title;
        }
        this.content = content;
        this.color = color;
        this.pinned = pinned;
        this.tags.clear();
        if (tags != null) {
            this.tags.addAll(tags.stream().map(String::trim).filter(s -> !s.isEmpty()).toList());
        }
        setData(data);
    }

    public void applyLayout(NoteLayout layout, double positionIndex) {
        if (layout != null) {
            this.layout = layout;
        }
        this.positionIndex = positionIndex;
    }

    public void changeCategory(NoteCategory category) {
        this.category = Objects.requireNonNull(category, "category must not be null");
    }

    public Map<String, Object> getData() {
        return JsonUtils.immutableCopy(data);
    }

    public void setData(Map<String, Object> data) {
        this.data = new LinkedHashMap<>();
        if (data != null) {
            data.forEach((key, value) -> {
                if (key != null && !key.isBlank()) {
                    this.data.put(key, value);
                }
            });
        }
        this.dataJson = JsonUtils.toJson(this.data);
    }

    @PostLoad
    private void loadDataFromJson() {
        this.data = new LinkedHashMap<>(JsonUtils.toMap(this.dataJson));
    }

    @PrePersist
    @PreUpdate
    private void syncJson() {
        this.dataJson = JsonUtils.toJson(this.data);
    }
}

package com.foongdoll.backend.modules.note.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NoteRepository extends JpaRepository<Note, Long> {

    @Query(
            value = """
                SELECT * FROM notes n
                WHERE n.author_id = :authorId
                  AND (:categoryId IS NULL OR :categoryId = 0 OR n.category_id = :categoryId)
                  AND (
                       :keyword IS NULL
                       OR LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                       OR LOWER(COALESCE(n.content, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                       OR LOWER(COALESCE(n.data_json, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                  )
                ORDER BY n.position_index DESC, n.updated_at DESC
                """,
            countQuery = """
                SELECT COUNT(1) FROM notes n
                WHERE n.author_id = :authorId
                  AND (:categoryId IS NULL OR :categoryId = 0 OR n.category_id = :categoryId)
                  AND (
                       :keyword IS NULL
                       OR LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                       OR LOWER(COALESCE(n.content, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                       OR LOWER(COALESCE(n.data_json, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                  )
                """,
            nativeQuery = true
    )
    Page<Note> search(
            @Param("authorId") Long authorId,
            @Param("categoryId") Long categoryId,
            @Param("keyword") String keyword,
            Pageable pageable
    );


    @Query("select coalesce(max(n.positionIndex), 0) from Note n where n.author.id = :authorId")
    double findMaxPositionIndex(@Param("authorId") Long authorId);

    boolean existsByAuthorIdAndCategoryId(Long authorId, Long categoryId);
}

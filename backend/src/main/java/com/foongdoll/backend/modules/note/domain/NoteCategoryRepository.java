package com.foongdoll.backend.modules.note.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NoteCategoryRepository extends JpaRepository<NoteCategory, Long> {

    List<NoteCategory> findByOwnerIdOrderByNameAsc(Long ownerId);

    Optional<NoteCategory> findByIdAndOwnerId(Long id, Long ownerId);

    boolean existsByOwnerIdAndNameIgnoreCase(Long ownerId, String name);
}

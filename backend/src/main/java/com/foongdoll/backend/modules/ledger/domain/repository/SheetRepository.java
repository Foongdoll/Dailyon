package com.foongdoll.backend.modules.ledger.domain.repository;

import com.foongdoll.backend.modules.ledger.domain.Sheet;
import com.foongdoll.backend.modules.user.presentation.dto.SheetDtos;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SheetRepository extends JpaRepository<Sheet,Long> {
    Page<Sheet> findByOwner_Id(Long ownerId, Pageable pageable);
    Page<Sheet> findByOwner_IdAndTitleContainingIgnoreCase(Long ownerId, String title, Pageable pageable);
    Optional<Sheet> findByIdAndOwner_Id(Long sheetId, Long ownerId);

    long deleteByIdAndOwner_Id(Long id, Long ownerId);
}

package com.foongdoll.backend.modules.ledger.domain.repository;

import com.foongdoll.backend.modules.ledger.domain.SheetCell;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SheetCellRepository extends JpaRepository<SheetCell,Long> {

    List<SheetCell> findBySheet_Id(Long sheetId);

    // 범위 조회 (옵션)
    List<SheetCell> findBySheet_IdAndRowIndexBetweenAndColIndexBetween(
            Long sheetId, Integer startRow, Integer endRow, Integer startCol, Integer endCol);

    Optional<SheetCell> findBySheet_IdAndRowIndexAndColIndex(Long sheetId, Integer rowIndex, Integer colIndex);

    long deleteBySheet_Id(Long sheetId);

    long deleteBySheet_IdAndRowIndexBetweenAndColIndexBetween(
            Long sheetId, Integer startRow, Integer endRow, Integer startCol, Integer endCol);
}

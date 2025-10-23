package com.foongdoll.backend.modules.ledger.application;

import com.foongdoll.backend.modules.ledger.domain.Sheet;
import com.foongdoll.backend.modules.ledger.domain.SheetCell;
import com.foongdoll.backend.modules.ledger.domain.SheetOrientation;
import com.foongdoll.backend.modules.ledger.domain.repository.SheetCellRepository;
import com.foongdoll.backend.modules.ledger.domain.repository.SheetRepository;
import com.foongdoll.backend.modules.user.domain.User;
import com.foongdoll.backend.modules.user.presentation.dto.SheetDtos;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LedgerService {

    private final SheetRepository sheetRepository;
    private final SheetCellRepository sheetCellRepository;

    private static final int MIN_ROWS = 10;
    private static final int MIN_COLS = 5;
    private static final int MAX_ROWS = 500;
    private static final int MAX_COLS = 200;

    @Transactional(readOnly = true)
    public Page<SheetDtos.SheetResponse> list(Long ownerId, String title, Pageable pageable) {
        Page<Sheet> page;
        if (title == null || title.isBlank()) {
            page = sheetRepository.findByOwner_Id(ownerId, pageable);
        } else {
            page = sheetRepository.findByOwner_IdAndTitleContainingIgnoreCase(ownerId, title, pageable);
        }
        return page.map(SheetDtos.SheetResponse::from);
    }

    /** 시트 생성 */
    @Transactional
    public SheetDtos.SheetResponse create(SheetDtos.SheetSaveRequest req, User owner) {
        SheetOrientation orientation = SheetOrientation.orDefault(req.orientation(), SheetOrientation.LANDSCAPE);
        int rowCount = sanitizeRows(req.rowCount(), orientation);
        int columnCount = sanitizeColumns(req.columnCount(), orientation);

        Sheet sheet = Sheet.builder()
                .owner(owner)
                .title(Optional.ofNullable(req.title()).orElse("Untitled"))
                .description(req.description())
                .orientation(orientation)
                .rowCount(rowCount)
                .columnCount(columnCount)
                .build();
        sheet = sheetRepository.save(sheet);

        upsertCells(sheet, req.cells(), req.replaceAll());
        return SheetDtos.SheetResponse.from(sheet);
    }

    /** 시트 수정 (메타 + 셀 갱신) */
    @Transactional
    public SheetDtos.SheetResponse update(Long sheetId, SheetDtos.SheetSaveRequest req, Long ownerId) {
        Sheet sheet = sheetRepository.findByIdAndOwner_Id(sheetId, ownerId)
                .orElseThrow(() -> new EntityNotFoundException("Sheet not found or not owned by user"));

        if (req.title() != null) sheet.setTitle(req.title());
        if (req.description() != null) sheet.setDescription(req.description());
        if (req.orientation() != null && req.orientation() != sheet.getOrientation()) {
            sheet.setOrientation(req.orientation());
            sheet.setRowCount(Math.max(sheet.getRowCount(), defaultRowsFor(sheet.getOrientation())));
            sheet.setColumnCount(Math.max(sheet.getColumnCount(), defaultColumnsFor(sheet.getOrientation())));
        }
        if (req.rowCount() != null) {
            int target = sanitizeRows(req.rowCount(), sheet.getOrientation());
            sheet.setRowCount(Math.max(sheet.getRowCount(), target));
        }
        if (req.columnCount() != null) {
            int target = sanitizeColumns(req.columnCount(), sheet.getOrientation());
            sheet.setColumnCount(Math.max(sheet.getColumnCount(), target));
        }

        upsertCells(sheet, req.cells(), req.replaceAll());
        return SheetDtos.SheetResponse.from(sheet);
    }

    /** 시트 삭제 */
    @Transactional
    public void delete(Long sheetId, Long ownerId) {
        long affected = sheetRepository.deleteByIdAndOwner_Id(sheetId, ownerId);
        if (affected == 0) {
            throw new EntityNotFoundException("Sheet not found or not owned by user");
        }
    }

    @Transactional(readOnly = true)
    public SheetDtos.SheetContentResponse get(Long sheetId, Long ownerId) {
        Sheet sheet = sheetRepository.findByIdAndOwner_Id(sheetId, ownerId)
                .orElseThrow(() -> new EntityNotFoundException("Sheet not found or not owned by user"));
        List<SheetCell> cells = sheetCellRepository.findBySheet_Id(sheetId);
        List<SheetDtos.CellDto> cellDtos = cells.stream().map(SheetDtos.CellDto::from).toList();
        return new SheetDtos.SheetContentResponse(SheetDtos.SheetResponse.from(sheet), cellDtos);
    }

    /** 셀 upsert (replaceAll=true면 기존 데이터 일괄 삭제 후 입력) */
    private void upsertCells(Sheet sheet, List<SheetDtos.CellDto> cells, Boolean replaceAll) {
        if (cells == null || cells.isEmpty()) return;

        if (Boolean.TRUE.equals(replaceAll)) {
            sheetCellRepository.deleteBySheet_Id(sheet.getId());
        }

        for (SheetDtos.CellDto dto : cells) {
            Integer r = dto.rowIndex();
            Integer c = dto.colIndex();
            if (r == null || c == null) continue;

            SheetCell cell = sheetCellRepository
                    .findBySheet_IdAndRowIndexAndColIndex(sheet.getId(), r, c)
                    .orElseGet(() -> SheetCell.builder()
                            .sheet(sheet)
                            .rowIndex(r)
                            .colIndex(c)
                            .build());

            cell.setValueRaw(dto.valueRaw());
            cell.setValueType(dto.valueType());
            cell.setFormula(dto.formula());
            cell.setValueCalc(dto.valueCalc());
            cell.setFormatJson(dto.formatJson());
            cell.setStyleJson(dto.styleJson());
            cell.setNote(dto.note());

            sheetCellRepository.save(cell);
        }
    }

    private int sanitizeRows(Integer candidate, SheetOrientation orientation) {
        return clamp(candidate, MIN_ROWS, MAX_ROWS, defaultRowsFor(orientation));
    }

    private int sanitizeColumns(Integer candidate, SheetOrientation orientation) {
        return clamp(candidate, MIN_COLS, MAX_COLS, defaultColumnsFor(orientation));
    }

    private int clamp(Integer candidate, int min, int max, int fallback) {
        int value = candidate != null ? candidate : fallback;
        if (value < min) return min;
        return Math.min(value, max);
    }

    private int defaultRowsFor(SheetOrientation orientation) {
        return orientation == SheetOrientation.PORTRAIT ? 80 : 40;
    }

    private int defaultColumnsFor(SheetOrientation orientation) {
        return orientation == SheetOrientation.PORTRAIT ? 18 : 26;
    }
}

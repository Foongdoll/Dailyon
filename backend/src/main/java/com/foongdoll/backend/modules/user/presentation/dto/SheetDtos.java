package com.foongdoll.backend.modules.user.presentation.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.foongdoll.backend.modules.ledger.domain.Sheet;
import com.foongdoll.backend.modules.ledger.domain.SheetCell;
import com.foongdoll.backend.modules.ledger.domain.SheetOrientation;

import java.time.LocalDateTime;
import java.util.List;

public class SheetDtos {

    @JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
    public record SheetResponse(
            Long id,
            Long ownerId,
            String title,
            String description,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            SheetOrientation orientation,
            Integer rowCount,
            Integer columnCount
    ) {
        public static SheetResponse from(Sheet s) {
            return new SheetResponse(
                    s.getId(),
                    s.getOwner().getId(),
                    s.getTitle(),
                    s.getDescription(),
                    s.getCreatedAt(),
                    s.getUpdatedAt(),
                    s.getOrientation(),
                    s.getRowCount(),
                    s.getColumnCount()
            );
        }
    }

    /** ? ?⑥쐞 DTO */
    @JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
    public record CellDto(
            Integer rowIndex,
            Integer colIndex,
            String valueRaw,
            String valueType,
            String formula,
            String valueCalc,
            String formatJson,
            String styleJson,
            String note
    ) {
        public static CellDto from(SheetCell c) {
            return new CellDto(
                    c.getRowIndex(),
                    c.getColIndex(),
                    c.getValueRaw(),
                    c.getValueType(),
                    c.getFormula(),
                    c.getValueCalc(),
                    c.getFormatJson(),
                    c.getStyleJson(),
                    c.getNote()
            );
        }
    }

    /** ?쒗듃 + ? ?댁슜 ?묐떟 */
    @JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
    public record SheetContentResponse(
            SheetResponse sheet,
            List<CellDto> cells
    ) {}

    /** ?앹꽦/?섏젙 ?붿껌 (?꾩껜 ?ㅻ깄??or 遺遺??낆꽌?? */
    @JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
    public record SheetSaveRequest(
            Long ownerId,                // ?앹꽦/?섏젙 ???뚯쑀???뺤씤
            String title,
            String description,
            SheetOrientation orientation,
            Integer rowCount,
            Integer columnCount,
            Boolean replaceAll,          // true硫?湲곗〈 ? ?꾨? ??젣 ??媛덉븘?쇱?
            List<CellDto> cells          // ?ｌ쓣 ?(?낆꽌?????
    ) {}

}



package com.foongdoll.backend.modules.ledger.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "sheet_cell",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"sheet_id", "row_index", "col_index"})
        },
        indexes = {
                @Index(name = "idx_sheet_row", columnList = "sheet_id, row_index")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SheetCell {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 내부용 PK (복합키 대신 surrogate key)

    /** 시트와의 관계 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sheet_id", nullable = false)
    private Sheet sheet;

    /** 좌표 (엑셀 위치) */
    @Column(name = "row_index", nullable = false)
    private Integer rowIndex;

    @Column(name = "col_index", nullable = false)
    private Integer colIndex;

    /** 셀 데이터 */
    @Column(name = "value_raw", columnDefinition = "TEXT")
    private String valueRaw; // 원본 값

    @Column(name = "value_type", length = 20)
    private String valueType; // text, number, date, formula 등

    @Column(name = "formula", columnDefinition = "TEXT")
    private String formula; // 예: =SUM(A1:A5)

    @Column(name = "value_calc", columnDefinition = "TEXT")
    private String valueCalc; // 계산된 결과 캐시

    /** JSON 필드 */
    @Column(name = "format_json", columnDefinition = "TEXT")
    private String formatJson; // 포맷 정보 (숫자/날짜/통화 등)

    @Column(name = "style_json", columnDefinition = "TEXT")
    private String styleJson; // 스타일 정보 (색, 정렬 등)

    @Column(name = "note", columnDefinition = "TEXT")
    private String note; // 셀 메모
}


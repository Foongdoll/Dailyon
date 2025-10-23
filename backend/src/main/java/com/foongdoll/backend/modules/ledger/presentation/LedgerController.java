package com.foongdoll.backend.modules.ledger.presentation;

import com.foongdoll.backend.common.api.ApiResponse;
import com.foongdoll.backend.common.util.SecurityUtils;
import com.foongdoll.backend.modules.ledger.application.LedgerService;
import com.foongdoll.backend.modules.user.domain.User;
import com.foongdoll.backend.modules.user.presentation.dto.SheetDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ledger")
public class LedgerController {

    private final LedgerService ledgerService;

    @GetMapping
    public ApiResponse<Page<SheetDtos.SheetResponse>> list(
            @RequestParam Long ownerId,
            @RequestParam(required = false) String title,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt,DESC") String sort // "field,ASC|DESC"
    ) {
        String[] arr = sort.split(",", 2);
        Sort.Direction dir = (arr.length == 2 && "ASC".equalsIgnoreCase(arr[1])) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, arr[0]));
        return ApiResponse.ok(ledgerService.list(ownerId, title, pageable), SecurityUtils.traceId());
    }

    @GetMapping("/{sheetId}")
    public ApiResponse<SheetDtos.SheetContentResponse> detail(
            @PathVariable Long sheetId,
            @RequestParam Long ownerId
    ) {
        return ApiResponse.ok(ledgerService.get(sheetId, ownerId), SecurityUtils.traceId());
    }

    /** 시트 생성 */
    @PostMapping
    public ApiResponse<SheetDtos.SheetResponse> create(@RequestBody SheetDtos.SheetSaveRequest req) {        
        User owner = new User();
        owner.setId(req.ownerId());
        return ApiResponse.ok(ledgerService.create(req, owner), SecurityUtils.traceId());
    }

    /** 시트 수정 */
    @PutMapping("/{sheetId}")
    public ApiResponse<SheetDtos.SheetResponse> update(
            @PathVariable Long sheetId,
            @RequestBody SheetDtos.SheetSaveRequest req
    ) {
        return ApiResponse.ok(ledgerService.update(sheetId, req, req.ownerId()), SecurityUtils.traceId());
    }

    /** 시트 삭제 */
    @DeleteMapping("/{sheetId}")
    public void delete(
            @PathVariable Long sheetId,
            @RequestParam Long ownerId
    ) {
        ledgerService.delete(sheetId, ownerId);
    }
}



package com.foongdoll.backend.modules.planner.presentation;

import com.foongdoll.backend.common.api.ApiResponse;
import com.foongdoll.backend.common.error.DailyonException;
import com.foongdoll.backend.common.error.ErrorCode;
import com.foongdoll.backend.common.util.SecurityUtils;
import com.foongdoll.backend.modules.planner.application.PlannerEventService;
import com.foongdoll.backend.modules.planner.presentation.dto.PlannerDtos;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/planner/events")
@RequiredArgsConstructor
public class PlannerEventController {

    private final PlannerEventService plannerEventService;

    @GetMapping
    public ApiResponse<List<PlannerDtos.PlannerEventResponse>> list(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        if (endDate.isBefore(startDate)) {
            throw new DailyonException(ErrorCode.VALIDATION_ERROR, "날짜 범위가 올바르지 않습니다.");
        }
        Long userId = SecurityUtils.getCurrentUserId();
        var events = plannerEventService.getRange(userId, startDate, endDate).stream()
                .map(event -> PlannerDtos.PlannerEventResponse.from(event, userId))
                .toList();
        return ApiResponse.ok(events, SecurityUtils.traceId());
    }

    @GetMapping("/{eventId}")
    public ApiResponse<PlannerDtos.PlannerEventResponse> detail(@PathVariable Long eventId) {
        Long userId = SecurityUtils.getCurrentUserId();
        var event = plannerEventService.getAccessible(userId, eventId);
        return ApiResponse.ok(PlannerDtos.PlannerEventResponse.from(event, userId), SecurityUtils.traceId());
    }

    @PostMapping
    public ApiResponse<PlannerDtos.PlannerEventResponse> create(@RequestBody PlannerDtos.PlannerEventRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        var event = plannerEventService.create(userId, request);
        return ApiResponse.ok(PlannerDtos.PlannerEventResponse.from(event, userId), SecurityUtils.traceId());
    }

    @PutMapping("/{eventId}")
    public ApiResponse<PlannerDtos.PlannerEventResponse> update(
            @PathVariable Long eventId,
            @RequestBody PlannerDtos.PlannerEventRequest request
    ) {
        Long userId = SecurityUtils.getCurrentUserId();
        var event = plannerEventService.update(userId, eventId, request);
        return ApiResponse.ok(PlannerDtos.PlannerEventResponse.from(event, userId), SecurityUtils.traceId());
    }

    @DeleteMapping("/{eventId}")
    public ApiResponse<Void> delete(@PathVariable Long eventId) {
        Long userId = SecurityUtils.getCurrentUserId();
        plannerEventService.delete(userId, eventId);
        return ApiResponse.ok(SecurityUtils.traceId());
    }

    @PostMapping("/{eventId}/share")
    public ApiResponse<PlannerDtos.PlannerEventResponse> toggleShare(
            @PathVariable Long eventId,
            @RequestBody PlannerDtos.ShareToggleRequest request
    ) {
        Long userId = SecurityUtils.getCurrentUserId();
        var event = plannerEventService.toggleShare(userId, eventId, request.shared());
        return ApiResponse.ok(PlannerDtos.PlannerEventResponse.from(event, userId), SecurityUtils.traceId());
    }

}

package com.foongdoll.backend.modules.planner.presentation;

import com.foongdoll.backend.common.api.ApiResponse;
import com.foongdoll.backend.modules.planner.application.PlannerEventService;
import com.foongdoll.backend.modules.planner.presentation.dto.PlannerDtos;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/planner/public")
@RequiredArgsConstructor
public class PlannerPublicController {

    private final PlannerEventService plannerEventService;

    @GetMapping("/events/{shareCode}")
    public ApiResponse<PlannerDtos.PlannerEventResponse> viewShared(@PathVariable String shareCode) {
        var event = plannerEventService.findPublic(shareCode);
        return ApiResponse.ok(PlannerDtos.PlannerEventResponse.from(event, null), MDC.get("traceId"));
    }
}

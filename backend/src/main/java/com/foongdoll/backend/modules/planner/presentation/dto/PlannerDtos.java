package com.foongdoll.backend.modules.planner.presentation.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.foongdoll.backend.modules.planner.domain.PlannerEvent;
import com.foongdoll.backend.modules.planner.domain.PlannerEventParticipant;
import com.foongdoll.backend.modules.user.domain.User;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;

public final class PlannerDtos {

    private PlannerDtos() {
    }

    @JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
    public record PlannerEventRequest(
            String title,
            String description,
            LocalDate startDate,
            LocalDate endDate,
            LocalTime startTime,
            LocalTime endTime,
            String remarks,
            String supplies,
            String location,
            List<String> tags,
            List<Long> participantIds,
            List<String> guestNames,
            Boolean shared
    ) {
    }

    @JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
    public record ParticipantSummary(
            Long id,
            String nickname,
            String email
    ) {
        public static ParticipantSummary from(User user) {
            return new ParticipantSummary(user.getId(), user.getNickname(), user.getEmail());
        }
    }

    @JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
    public record PlannerEventResponse(
            Long id,
            String title,
            String description,
            LocalDate startDate,
            LocalDate endDate,
            LocalTime startTime,
            LocalTime endTime,
            String remarks,
            String supplies,
            String location,
            List<String> tags,
            List<ParticipantSummary> participants,
            List<String> guestNames,
            boolean shared,
            String shareCode,
            String ownerName,
            boolean editable
    ) {
        public static PlannerEventResponse from(PlannerEvent event, Long currentUserId) {
            List<ParticipantSummary> participantSummaries = event.getParticipants().stream()
                    .map(PlannerEventParticipant::getUser)
                    .filter(Objects::nonNull)
                    .map(ParticipantSummary::from)
                    .toList();
            return new PlannerEventResponse(
                    event.getId(),
                    event.getTitle(),
                    event.getDescription(),
                    event.getStartDate(),
                    event.getEndDate(),
                    event.getStartTime(),
                    event.getEndTime(),
                    event.getRemarks(),
                    event.getSupplies(),
                    event.getLocationName(),
                    event.getTags().stream().toList(),
                    participantSummaries,
                    event.getGuestNames(),
                    event.isShared(),
                    event.isShared() ? event.getShareCode() : null,
                    event.getOwner().getNickname(),
                    currentUserId != null && Objects.equals(event.getOwner().getId(), currentUserId)
            );
        }
    }

    public record ShareToggleRequest(boolean shared) {
    }
}

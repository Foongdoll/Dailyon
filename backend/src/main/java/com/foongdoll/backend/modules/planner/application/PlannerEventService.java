package com.foongdoll.backend.modules.planner.application;

import com.foongdoll.backend.common.error.DailyonException;
import com.foongdoll.backend.common.error.ErrorCode;
import com.foongdoll.backend.modules.planner.domain.PlannerEvent;
import com.foongdoll.backend.modules.planner.domain.PlannerEventRepository;
import com.foongdoll.backend.modules.planner.presentation.dto.PlannerDtos;
import com.foongdoll.backend.modules.user.domain.User;
import com.foongdoll.backend.modules.user.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlannerEventService {

    private final PlannerEventRepository eventRepository;
    private final UserRepository userRepository;

    public List<PlannerEvent> getRange(Long userId, LocalDate start, LocalDate end) {
        return eventRepository.findAllInRangeForUser(userId, start, end);
    }

    public PlannerEvent getAccessible(Long userId, Long eventId) {
        PlannerEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new DailyonException(ErrorCode.NOT_FOUND, "일정을 찾을 수 없습니다."));
        if (!event.isParticipant(userId)) {
            throw new DailyonException(ErrorCode.FORBIDDEN, "일정 접근 권한이 없습니다.");
        }
        return event;
    }

    public PlannerEvent getOwned(Long userId, Long eventId) {
        PlannerEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new DailyonException(ErrorCode.NOT_FOUND, "일정을 찾을 수 없습니다."));
        if (!Objects.equals(event.getOwner().getId(), userId)) {
            throw new DailyonException(ErrorCode.FORBIDDEN, "작성자만 수정할 수 있습니다.");
        }
        return event;
    }

    public PlannerEvent findPublic(String shareCode) {
        return eventRepository.findByShareCode(shareCode)
                .filter(it -> it.getShareCode() != null && it.isShared())
                .orElseThrow(() -> new DailyonException(ErrorCode.NOT_FOUND, "공유된 일정을 찾을 수 없습니다."));
    }

    @Transactional
    public PlannerEvent create(Long userId, PlannerDtos.PlannerEventRequest request) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new DailyonException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다."));

        LocalDate startDate = requireStartDate(request.startDate());
        LocalDate endDate = resolveEndDate(startDate, request.endDate());

        PlannerEvent event = PlannerEvent.builder()
                .owner(owner)
                .title(request.title())
                .description(request.description())
                .startDate(startDate)
                .endDate(endDate)
                .startTime(request.startTime())
                .endTime(request.endTime())
                .remarks(request.remarks())
                .supplies(request.supplies())
                .locationName(request.location())
                .shared(Boolean.TRUE.equals(request.shared()))
                .shareCode(null)
                .tags(request.tags())
                .guestNames(request.guestNames())
                .build();

        if (Boolean.TRUE.equals(request.shared())) {
            event.markShared(true, generateShareCode());
        }

        applyParticipants(event, request.participantIds());

        return eventRepository.save(event);
    }

    @Transactional
    public PlannerEvent update(Long userId, Long eventId, PlannerDtos.PlannerEventRequest request) {
        PlannerEvent event = getOwned(userId, eventId);
        LocalDate nextStart = request.startDate() != null ? request.startDate() : event.getStartDate();
        LocalDate requestedEnd = request.endDate();
        LocalDate nextEnd;
        if (requestedEnd != null) {
            nextEnd = resolveEndDate(nextStart, requestedEnd);
        } else if (request.startDate() != null) {
            nextEnd = nextStart;
        } else {
            nextEnd = event.getEndDate();
        }

        event.update(
                request.title(),
                request.description(),
                nextStart,
                nextEnd,
                request.startTime(),
                request.endTime(),
                request.remarks(),
                request.supplies(),
                request.location(),
                request.tags(),
                request.guestNames()
        );
        applyParticipants(event, request.participantIds());

        if (request.shared() != null) {
            if (Boolean.TRUE.equals(request.shared())) {
                if (event.getShareCode() == null) {
                    event.markShared(true, generateShareCode());
                } else {
                    event.markShared(true, event.getShareCode());
                }
            } else {
                event.markShared(false, null);
            }
        }

        return event;
    }

    @Transactional
    public void delete(Long userId, Long eventId) {
        PlannerEvent event = getOwned(userId, eventId);
        eventRepository.delete(event);
    }

    @Transactional
    public PlannerEvent toggleShare(Long userId, Long eventId, boolean shared) {
        PlannerEvent event = getOwned(userId, eventId);
        if (shared) {
            if (event.getShareCode() == null) {
                event.markShared(true, generateShareCode());
            } else {
                event.markShared(true, event.getShareCode());
            }
        } else {
            event.markShared(false, null);
        }
        return event;
    }

    private void applyParticipants(PlannerEvent event, List<Long> participantIds) {
        if (participantIds == null || participantIds.isEmpty()) {
            event.setParticipants(Collections.emptyList());
            return;
        }
        Set<Long> distinct = participantIds.stream()
                .filter(Objects::nonNull)
                .filter(id -> !Objects.equals(id, event.getOwner().getId()))
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (distinct.isEmpty()) {
            event.setParticipants(Collections.emptyList());
            return;
        }
        List<User> users = userRepository.findAllById(distinct);
        Map<Long, User> userMap = users.stream().collect(Collectors.toMap(User::getId, it -> it));
        List<User> ordered = distinct.stream()
                .map(userMap::get)
                .filter(Objects::nonNull)
                .toList();
        event.setParticipants(ordered);
    }

    private String generateShareCode() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private LocalDate requireStartDate(LocalDate startDate) {
        if (startDate == null) {
            throw new DailyonException(ErrorCode.VALIDATION_ERROR, "시작일을 입력해주세요.");
        }
        return startDate;
    }

    private LocalDate resolveEndDate(LocalDate startDate, LocalDate candidate) {
        LocalDate end = candidate == null ? startDate : candidate;
        if (end.isBefore(startDate)) {
            throw new DailyonException(ErrorCode.VALIDATION_ERROR, "종료일은 시작일보다 빠를 수 없습니다.");
        }
        return end;
    }
}

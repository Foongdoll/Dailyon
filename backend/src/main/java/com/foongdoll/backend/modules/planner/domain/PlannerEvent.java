package com.foongdoll.backend.modules.planner.domain;

import com.foongdoll.backend.common.audit.Auditable;
import com.foongdoll.backend.modules.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "planner_events",
        indexes = {
                @Index(name = "idx_planner_event_owner", columnList = "owner_id"),
                @Index(name = "idx_planner_event_start", columnList = "start_date"),
                @Index(name = "idx_planner_event_end", columnList = "end_date")
        }
)
@Entity
public class PlannerEvent extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "planner_event_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false, foreignKey = @ForeignKey(name = "fk_planner_event_owner"))
    private User owner;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /**
     * Legacy column kept in schema (start date mirror). TODO: remove once DB migration drops event_date.
     */
    @Column(name = "event_date", nullable = false)
    private LocalDate legacyEventDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(columnDefinition = "TEXT")
    private String supplies;

    @Column(name = "location_name", length = 255)
    private String locationName;

    @Column(nullable = false)
    private boolean shared;

    @Column(name = "share_code", length = 80, unique = true)
    private String shareCode;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "planner_event_tags", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "tag_value", length = 40, nullable = false)
    private Set<String> tags = new LinkedHashSet<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlannerEventParticipant> participants = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "planner_event_guests", joinColumns = @JoinColumn(name = "event_id"))
    @OrderColumn(name = "guest_order")
    @Column(name = "guest_name", length = 100, nullable = false)
    private List<String> guestNames = new ArrayList<>();

    @Builder
    private PlannerEvent(
            User owner,
            String title,
            String description,
            LocalDate startDate,
            LocalDate endDate,
            LocalTime startTime,
            LocalTime endTime,
            String remarks,
            String supplies,
            String locationName,
            boolean shared,
            String shareCode,
            Collection<String> tags,
            Collection<String> guestNames
    ) {
        this.owner = Objects.requireNonNull(owner, "owner must not be null");
        this.title = Objects.requireNonNull(title, "title must not be null");
        this.startDate = Objects.requireNonNull(startDate, "startDate must not be null");
        this.endDate = endDate == null ? this.startDate : endDate;
        if (this.endDate.isBefore(this.startDate)) {
            throw new IllegalArgumentException("endDate must be on or after startDate");
        }
        this.legacyEventDate = this.startDate;
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.remarks = remarks;
        this.supplies = supplies;
        this.locationName = locationName;
        this.shared = shared;
        this.shareCode = shareCode;
        setTags(tags);
        setGuestNames(guestNames);
    }

    public void update(
            String title,
            String description,
            LocalDate startDate,
            LocalDate endDate,
            LocalTime startTime,
            LocalTime endTime,
            String remarks,
            String supplies,
            String locationName,
            Collection<String> tags,
            Collection<String> guestNames
    ) {
        if (title != null && !title.isBlank()) {
            this.title = title;
        }
        this.startDate = Objects.requireNonNull(startDate, "startDate must not be null");
        this.endDate = Objects.requireNonNull(endDate, "endDate must not be null");
        if (this.endDate.isBefore(this.startDate)) {
            throw new IllegalArgumentException("endDate must be on or after startDate");
        }
        this.legacyEventDate = this.startDate;
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.remarks = remarks;
        this.supplies = supplies;
        this.locationName = locationName;
        setTags(tags);
        setGuestNames(guestNames);
    }

    public void setTags(Collection<String> input) {
        this.tags.clear();
        if (input != null) {
            for (String tag : input) {
                if (tag != null && !tag.isBlank()) {
                    this.tags.add(tag.trim());
                }
            }
        }
    }

    public void setGuestNames(Collection<String> names) {
        this.guestNames.clear();
        if (names == null) {
            return;
        }
        for (String name : names) {
            if (name != null && !name.trim().isEmpty()) {
                this.guestNames.add(name.trim());
            }
        }
    }

    public List<String> getGuestNames() {
        return List.copyOf(guestNames);
    }

    public void setParticipants(Collection<User> users) {
        Map<Long, PlannerEventParticipant> current = new HashMap<>();
        for (PlannerEventParticipant participant : participants) {
            current.put(participant.getUser().getId(), participant);
        }

        participants.removeIf(participant -> users == null || users.stream()
                .noneMatch(user -> Objects.equals(user.getId(), participant.getUser().getId())));

        if (users == null) {
            return;
        }

        for (User user : users) {
            if (user == null) continue;
            if (Objects.equals(user.getId(), owner.getId())) {
                continue;
            }
            if (current.containsKey(user.getId())) {
                continue;
            }
            PlannerEventParticipant participant = PlannerEventParticipant.of(this, user);
            participants.add(participant);
        }
    }

    public void markShared(boolean shared, String shareCode) {
        this.shared = shared;
        this.shareCode = shareCode;
    }

    public boolean isParticipant(Long userId) {
        if (userId == null) return false;
        if (Objects.equals(owner.getId(), userId)) return true;
        return participants.stream().anyMatch(it -> Objects.equals(it.getUser().getId(), userId));
    }
}

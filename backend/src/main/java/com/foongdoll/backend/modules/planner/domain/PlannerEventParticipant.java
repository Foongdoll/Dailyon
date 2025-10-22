package com.foongdoll.backend.modules.planner.domain;

import com.foongdoll.backend.modules.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "planner_event_participants",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_planner_participant",
                columnNames = {"event_id", "user_id"}
        )
)
@Entity
public class PlannerEventParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "planner_event_participant_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false, foreignKey = @ForeignKey(name = "fk_planner_participant_event"))
    private PlannerEvent event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_planner_participant_user"))
    private User user;

    private PlannerEventParticipant(PlannerEvent event, User user) {
        this.event = event;
        this.user = user;
    }

    public static PlannerEventParticipant of(PlannerEvent event, User user) {
        return new PlannerEventParticipant(event, user);
    }
}

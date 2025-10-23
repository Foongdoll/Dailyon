package com.foongdoll.backend.modules.planner.domain;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PlannerEventRepository extends JpaRepository<PlannerEvent, Long> {

    @EntityGraph(attributePaths = {"participants", "participants.user"})
    @Query("""
            select distinct e
            from PlannerEvent e
            left join e.participants participants
            where (e.owner.id = :userId or participants.user.id = :userId)
              and e.startDate <= :end
              and e.endDate >= :start
            order by e.startDate asc, e.startTime asc
            """)
    List<PlannerEvent> findAllInRangeForUser(
            @Param("userId") Long userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );

    @EntityGraph(attributePaths = {"participants", "participants.user"})
    Optional<PlannerEvent> findById(Long id);

    @EntityGraph(attributePaths = {"participants", "participants.user"})
    Optional<PlannerEvent> findByShareCode(String shareCode);
}

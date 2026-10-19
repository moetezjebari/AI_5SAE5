package com.aisae.lms.assistant;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUserIdOrderByUpdatedAtDescIdDesc(Long userId);

    Optional<Conversation> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);
}

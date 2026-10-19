package com.aisae.lms.assistant;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByConversationIdOrderByIdAsc(Long conversationId);

    /** Les derniers messages (ordre décroissant) ; à inverser par l'appelant. */
    List<ChatMessage> findByConversationIdOrderByIdDesc(Long conversationId, Pageable page);

    Optional<ChatMessage> findByConversationIdAndClientMessageId(Long conversationId, String clientMessageId);

    Optional<ChatMessage> findFirstByConversationIdAndSenderAndIdGreaterThanOrderByIdAsc(
            Long conversationId, ChatMessage.Sender sender, Long id);

    @Query("select count(m) from ChatMessage m where m.conversationId in "
            + "(select c.id from Conversation c where c.userId = :userId)")
    long countByOwner(@Param("userId") Long userId);

    @Modifying
    @Query("delete from ChatMessage m where m.conversationId = :conversationId")
    void deleteByConversationId(@Param("conversationId") Long conversationId);
}

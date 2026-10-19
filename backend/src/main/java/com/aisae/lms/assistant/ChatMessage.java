package com.aisae.lms.assistant;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {
    public enum Sender { USER, ASSISTANT }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private Sender sender;

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String content;

    /** Identifiant d'idempotence fourni par le client (messages USER uniquement). */
    @Column(name = "client_message_id", length = 64)
    private String clientMessageId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ChatMessage() {}

    public ChatMessage(Long conversationId, Sender sender, String content, String clientMessageId) {
        this.conversationId = conversationId;
        this.sender = sender;
        this.content = content;
        this.clientMessageId = clientMessageId;
    }

    public Long getId() { return id; }
    public Long getConversationId() { return conversationId; }
    public Sender getSender() { return sender; }
    public String getContent() { return content; }
    public String getClientMessageId() { return clientMessageId; }
    public Instant getCreatedAt() { return createdAt; }
}

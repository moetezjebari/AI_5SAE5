-- Gestion 1 : champs de profil, révocation des jetons, assistant conversationnel.

ALTER TABLE users ADD COLUMN field          VARCHAR(80)  NULL;
ALTER TABLE users ADD COLUMN level          VARCHAR(40)  NULL;
ALTER TABLE users ADD COLUMN avatar         MEDIUMTEXT   NULL;
ALTER TABLE users ADD COLUMN token_version  INT          NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_login_at  DATETIME(6)  NULL;

CREATE TABLE conversations (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    title       VARCHAR(120) NOT NULL,
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_conversations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_conversations_user ON conversations(user_id, updated_at);

CREATE TABLE chat_messages (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id    BIGINT       NOT NULL,
    sender             ENUM('USER', 'ASSISTANT') NOT NULL,
    content            MEDIUMTEXT   NOT NULL,
    client_message_id  VARCHAR(64)  NULL,
    created_at         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_chat_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT uk_chat_messages_client UNIQUE (conversation_id, client_message_id)
) ENGINE=InnoDB;

CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, id);

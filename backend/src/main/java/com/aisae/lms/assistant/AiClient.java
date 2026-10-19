package com.aisae.lms.assistant;

import java.util.List;

/** Fournisseur IA remplaçable : le reste de l'assistant ne dépend que de cette interface. */
public interface AiClient {

    record Turn(boolean fromUser, String text) {}

    /** @throws AiUnavailableException si le fournisseur n'est pas configuré, injoignable, trop lent ou répond vide */
    String complete(String systemPrompt, List<Turn> history);

    class AiUnavailableException extends RuntimeException {
        public AiUnavailableException(String message) {
            super(message);
        }
    }
}

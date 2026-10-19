package com.aisae.lms.assistant;

import com.aisae.lms.recommendation.GeminiClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/** Adaptateur : l'assistant réutilise l'intégration Gemini existante du projet (clé, modèles, délais). */
@Component
public class GeminiAssistantClient implements AiClient {
    private final GeminiClient gemini;

    public GeminiAssistantClient(GeminiClient gemini) {
        this.gemini = gemini;
    }

    @Override
    public String complete(String systemPrompt, List<Turn> history) {
        if (!gemini.isConfigured()) {
            throw new AiUnavailableException("L'assistant IA n'est pas configuré (GEMINI_API_KEY manquante)");
        }
        List<Map<String, Object>> contents = new ArrayList<>();
        for (Turn t : history) {
            contents.add(Map.of("role", t.fromUser() ? "user" : "model", "parts", List.of(Map.of("text", t.text()))));
        }
        String answer = gemini.chat(systemPrompt, contents);
        if (answer == null) {
            throw new AiUnavailableException("Le service IA est indisponible ou trop lent, réessayez plus tard");
        }
        return answer;
    }
}

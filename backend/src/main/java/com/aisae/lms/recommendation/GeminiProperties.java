package com.aisae.lms.recommendation;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.gemini")
public record GeminiProperties(String apiKey, String model, String fallbackModels, int timeoutSeconds) {
    public java.util.List<String> allModelsInOrder() {
        java.util.List<String> models = new java.util.ArrayList<>();
        models.add(model);
        if (fallbackModels != null && !fallbackModels.isBlank()) {
            for (String m : fallbackModels.split(",")) {
                if (!m.isBlank()) {
                    models.add(m.trim());
                }
            }
        }
        return models;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}

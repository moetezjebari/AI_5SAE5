package com.aisae.lms.recommendation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

/**
 * Thin REST client for the Google Gemini API free tier. Only ever receives the minimal,
 * anonymized context built by RecommendationService — never raw student records.
 */
@Component
@EnableConfigurationProperties(GeminiProperties.class)
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);
    private static final String ENDPOINT_TEMPLATE =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    private final GeminiProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GeminiClient(GeminiProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(properties.timeoutSeconds()))
                .build();
    }

    public boolean isConfigured() {
        return properties.isConfigured();
    }

    /** Returns the raw text response, or null if every model attempt failed. */
    public String generateJson(String prompt) {
        if (!isConfigured()) {
            return null;
        }
        for (String model : properties.allModelsInOrder()) {
            try {
                String result = callModel(model, prompt);
                if (result != null) {
                    return result;
                }
            } catch (Exception ex) {
                log.warn("Appel Gemini échoué pour le modèle {} : {}", model, ex.getMessage());
            }
        }
        return null;
    }

    private String callModel(String model, String prompt) throws Exception {
        String url = String.format(ENDPOINT_TEMPLATE, model, properties.apiKey());

        Map<String, Object> body = Map.of(
                "contents", new Object[]{ Map.of("role", "user", "parts", new Object[]{ Map.of("text", prompt) }) },
                "generationConfig", Map.of("responseMimeType", "application/json", "temperature", 0.3)
        );
        String payload = objectMapper.writeValueAsString(body);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(properties.timeoutSeconds()))
                .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            log.warn("Gemini a répondu {} pour le modèle {} : {}", response.statusCode(), model, response.body());
            return null;
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            return null;
        }
        String text = textNode.asText().trim();
        return text.replaceAll("^```json", "").replaceAll("```$", "").trim();
    }
}

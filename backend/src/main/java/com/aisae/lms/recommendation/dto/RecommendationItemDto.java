package com.aisae.lms.recommendation.dto;

public record RecommendationItemDto(
        String type,       // COURSE | QUIZ
        Long resourceId,
        String title,
        String reason,
        String priority,   // HIGH | MEDIUM | LOW
        String action      // OPEN_COURSE | START_QUIZ
) {
}

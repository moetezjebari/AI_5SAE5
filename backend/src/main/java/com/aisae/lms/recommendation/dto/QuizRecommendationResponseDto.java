package com.aisae.lms.recommendation.dto;

import java.time.Instant;
import java.util.List;

public record QuizRecommendationResponseDto(
        String summary,
        List<QuizRecommendationDto> recommendations,
        String source,
        String modelUsed,
        Instant generatedAt,
        boolean cached
) {
}

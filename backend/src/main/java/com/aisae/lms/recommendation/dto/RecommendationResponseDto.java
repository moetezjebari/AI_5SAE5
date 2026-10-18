package com.aisae.lms.recommendation.dto;

import java.time.Instant;
import java.util.List;

public record RecommendationResponseDto(
        String summary,
        List<RecommendationItemDto> recommendations,
        String source,      // gemini | fallback
        String modelUsed,
        Instant generatedAt
) {
}

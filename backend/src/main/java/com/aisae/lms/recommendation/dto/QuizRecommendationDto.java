package com.aisae.lms.recommendation.dto;

import java.math.BigDecimal;

public record QuizRecommendationDto(
        Long quizId,
        String title,
        Long courseId,
        String courseTitle,
        String difficulty,
        int durationMinutes,
        BigDecimal passingScore,
        BigDecimal bestScore,
        BigDecimal lastScore,
        int attemptCount,
        String status,
        String statusLabel,
        String primaryTopic,
        String reason,
        String priority,
        String action
) {
}

package com.aisae.lms.analytics.dto;

import java.math.BigDecimal;

public record TopicPerformanceDto(
        String topic,
        int questionsAnswered,
        int correctAnswers,
        BigDecimal accuracyPercent,
        boolean sufficientEvidence,
        String classification // STRONG, WEAK, NEUTRAL, INSUFFICIENT_EVIDENCE
) {
}

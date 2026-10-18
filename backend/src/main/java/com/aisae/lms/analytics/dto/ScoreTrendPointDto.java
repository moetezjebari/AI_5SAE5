package com.aisae.lms.analytics.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record ScoreTrendPointDto(Long attemptId, String quizTitle, String courseTitle, BigDecimal scorePercent, Instant submittedAt) {
}

package com.aisae.lms.quiz.dto;

import com.aisae.lms.quiz.AttemptStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AttemptResultDto(
        Long attemptId,
        Long quizId,
        String quizTitle,
        Long courseId,
        String courseTitle,
        AttemptStatus status,
        BigDecimal score,
        BigDecimal totalPossibleScore,
        BigDecimal scorePercent,
        Integer correctCount,
        int questionCount,
        boolean passed,
        Instant startedAt,
        Instant submittedAt,
        Integer timeSpentSeconds,
        List<AttemptAnswerResultDto> answers
) {
}

package com.aisae.lms.quiz.dto;

import java.math.BigDecimal;
import java.util.List;

public record AttemptAnswerResultDto(
        Long questionId,
        String questionText,
        String topic,
        boolean correct,
        BigDecimal pointsEarned,
        List<Long> selectedOptionIds,
        List<Long> correctOptionIds
) {
}

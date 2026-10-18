package com.aisae.lms.quiz.dto;

import com.aisae.lms.course.CourseStatus;
import com.aisae.lms.quiz.QuizDifficulty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

public record QuizUpsertRequest(
        @NotNull Long courseId,
        @NotBlank String title,
        String description,
        @NotNull QuizDifficulty difficulty,
        @Positive int durationMinutes,
        @NotNull BigDecimal passingScore,
        @NotNull CourseStatus status,
        @Valid @NotEmpty List<QuizQuestionDto> questions
) {
}

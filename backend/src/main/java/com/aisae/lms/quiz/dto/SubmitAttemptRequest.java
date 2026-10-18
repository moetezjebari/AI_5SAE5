package com.aisae.lms.quiz.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

public record SubmitAttemptRequest(
        @Valid @NotEmpty List<AnswerSubmissionDto> answers,
        @PositiveOrZero Integer timeSpentSeconds
) {
}

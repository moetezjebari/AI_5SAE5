package com.aisae.lms.quiz.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AnswerSubmissionDto(@NotNull Long questionId, @NotEmpty List<Long> selectedOptionIds) {
}

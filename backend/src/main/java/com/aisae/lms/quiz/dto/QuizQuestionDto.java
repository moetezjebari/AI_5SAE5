package com.aisae.lms.quiz.dto;

import com.aisae.lms.quiz.QuestionType;
import com.aisae.lms.quiz.QuizQuestion;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record QuizQuestionDto(
        Long id,
        @NotBlank String questionText,
        QuestionType questionType,
        String topic,
        int points,
        int position,
        @Valid @NotEmpty List<QuizOptionDto> options
) {
    public static QuizQuestionDto full(QuizQuestion q) {
        return new QuizQuestionDto(q.getId(), q.getQuestionText(), q.getQuestionType(), q.getTopic(),
                q.getPoints(), q.getPosition(), q.getOptions().stream().map(QuizOptionDto::full).toList());
    }

    public static QuizQuestionDto redacted(QuizQuestion q) {
        return new QuizQuestionDto(q.getId(), q.getQuestionText(), q.getQuestionType(), q.getTopic(),
                q.getPoints(), q.getPosition(), q.getOptions().stream().map(QuizOptionDto::redacted).toList());
    }
}

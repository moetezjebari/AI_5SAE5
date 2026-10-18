package com.aisae.lms.quiz.dto;

import com.aisae.lms.quiz.QuizOption;
import jakarta.validation.constraints.NotBlank;

public record QuizOptionDto(Long id, @NotBlank String optionText, Boolean correct, int position) {

    /** For management (teacher/admin): includes the correct-answer flag. */
    public static QuizOptionDto full(QuizOption option) {
        return new QuizOptionDto(option.getId(), option.getOptionText(), option.isCorrect(), option.getPosition());
    }

    /** For students taking the quiz: the answer key is never exposed. */
    public static QuizOptionDto redacted(QuizOption option) {
        return new QuizOptionDto(option.getId(), option.getOptionText(), null, option.getPosition());
    }
}

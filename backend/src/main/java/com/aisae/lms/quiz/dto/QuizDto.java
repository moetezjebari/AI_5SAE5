package com.aisae.lms.quiz.dto;

import com.aisae.lms.course.CourseStatus;
import com.aisae.lms.quiz.Quiz;
import com.aisae.lms.quiz.QuizDifficulty;

import java.math.BigDecimal;
import java.util.List;

public record QuizDto(
        Long id,
        Long courseId,
        String courseTitle,
        String title,
        String description,
        QuizDifficulty difficulty,
        int durationMinutes,
        BigDecimal passingScore,
        CourseStatus status,
        int questionCount,
        List<QuizQuestionDto> questions
) {
    public static QuizDto summary(Quiz quiz) {
        return new QuizDto(quiz.getId(), quiz.getCourse().getId(), quiz.getCourse().getTitle(), quiz.getTitle(),
                quiz.getDescription(), quiz.getDifficulty(), quiz.getDurationMinutes(), quiz.getPassingScore(),
                quiz.getStatus(), quiz.getQuestions().size(), null);
    }

    public static QuizDto forManagement(Quiz quiz) {
        return new QuizDto(quiz.getId(), quiz.getCourse().getId(), quiz.getCourse().getTitle(), quiz.getTitle(),
                quiz.getDescription(), quiz.getDifficulty(), quiz.getDurationMinutes(), quiz.getPassingScore(),
                quiz.getStatus(), quiz.getQuestions().size(),
                quiz.getQuestions().stream().map(QuizQuestionDto::full).toList());
    }

    public static QuizDto forTaking(Quiz quiz) {
        return new QuizDto(quiz.getId(), quiz.getCourse().getId(), quiz.getCourse().getTitle(), quiz.getTitle(),
                quiz.getDescription(), quiz.getDifficulty(), quiz.getDurationMinutes(), quiz.getPassingScore(),
                quiz.getStatus(), quiz.getQuestions().size(),
                quiz.getQuestions().stream().map(QuizQuestionDto::redacted).toList());
    }
}

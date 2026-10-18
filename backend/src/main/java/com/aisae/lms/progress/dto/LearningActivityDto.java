package com.aisae.lms.progress.dto;

import com.aisae.lms.progress.ActivityType;
import com.aisae.lms.progress.LearningActivity;

import java.time.Instant;

public record LearningActivityDto(
        Long id,
        ActivityType type,
        String description,
        Long courseId,
        String courseTitle,
        Long quizId,
        String quizTitle,
        Instant createdAt
) {
    public static LearningActivityDto from(LearningActivity a) {
        return new LearningActivityDto(
                a.getId(), a.getActivityType(), a.getDescription(),
                a.getCourse() != null ? a.getCourse().getId() : null,
                a.getCourse() != null ? a.getCourse().getTitle() : null,
                a.getQuiz() != null ? a.getQuiz().getId() : null,
                a.getQuiz() != null ? a.getQuiz().getTitle() : null,
                a.getCreatedAt());
    }
}

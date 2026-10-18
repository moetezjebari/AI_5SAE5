package com.aisae.lms.recommendation.dto;

import jakarta.validation.constraints.NotBlank;

public record TeacherRecommendationRequest(
        Long studentId,
        String studentEmail,
        Long courseId,
        String courseTitle,

        @NotBlank(message = "Le motif de la recommandation est obligatoire")
        String reason,

        String priority
) {
}

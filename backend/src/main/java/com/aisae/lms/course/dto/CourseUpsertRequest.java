package com.aisae.lms.course.dto;

import com.aisae.lms.course.CourseLevel;
import com.aisae.lms.course.CourseStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

public record CourseUpsertRequest(
        @NotBlank String title,
        String description,
        @NotBlank String subject,
        @NotNull CourseLevel level,
        @PositiveOrZero int estimatedDurationMinutes,
        @NotNull CourseStatus status,
        @Valid List<LessonDto> lessons
) {
}

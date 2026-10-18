package com.aisae.lms.course.dto;

import com.aisae.lms.course.CourseLesson;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record LessonDto(
        Long id,
        @NotBlank String title,
        String content,
        String topic,
        @PositiveOrZero int durationMinutes,
        @PositiveOrZero int position
) {
    public static LessonDto from(CourseLesson lesson) {
        return new LessonDto(lesson.getId(), lesson.getTitle(), lesson.getContent(), lesson.getTopic(),
                lesson.getDurationMinutes(), lesson.getPosition());
    }
}

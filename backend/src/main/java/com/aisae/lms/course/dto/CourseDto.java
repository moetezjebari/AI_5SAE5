package com.aisae.lms.course.dto;

import com.aisae.lms.course.Course;
import com.aisae.lms.course.CourseLevel;
import com.aisae.lms.course.CourseStatus;

import java.time.Instant;
import java.util.List;

public record CourseDto(
        Long id,
        String title,
        String description,
        String subject,
        CourseLevel level,
        int estimatedDurationMinutes,
        CourseStatus status,
        Long createdBy,
        String createdByName,
        Instant createdAt,
        Instant updatedAt,
        List<LessonDto> lessons
) {
    public static CourseDto from(Course course, boolean includeLessons) {
        return new CourseDto(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getSubject(),
                course.getLevel(),
                course.getEstimatedDurationMinutes(),
                course.getStatus(),
                course.getCreatedBy().getId(),
                course.getCreatedBy().getFirstName() + " " + course.getCreatedBy().getLastName(),
                course.getCreatedAt(),
                course.getUpdatedAt(),
                includeLessons ? course.getLessons().stream().map(LessonDto::from).toList() : null
        );
    }
}

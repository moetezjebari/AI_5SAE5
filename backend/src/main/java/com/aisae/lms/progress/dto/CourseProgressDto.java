package com.aisae.lms.progress.dto;

import com.aisae.lms.progress.ProgressStatus;
import com.aisae.lms.progress.StudentCourseProgress;

import java.math.BigDecimal;
import java.time.Instant;

public record CourseProgressDto(
        Long courseId,
        String courseTitle,
        String subject,
        ProgressStatus status,
        BigDecimal progressPercent,
        Instant startedAt,
        Instant completedAt
) {
    public static CourseProgressDto from(StudentCourseProgress p) {
        return new CourseProgressDto(p.getCourse().getId(), p.getCourse().getTitle(), p.getCourse().getSubject(),
                p.getStatus(), p.getProgressPercent(), p.getStartedAt(), p.getCompletedAt());
    }
}

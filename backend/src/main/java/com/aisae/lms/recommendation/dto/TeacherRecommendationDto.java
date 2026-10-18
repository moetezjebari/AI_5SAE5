package com.aisae.lms.recommendation.dto;

import com.aisae.lms.recommendation.TeacherRecommendation;

import java.time.Instant;

public record TeacherRecommendationDto(
        Long id,
        Long teacherId,
        String teacherName,
        Long studentId,
        String studentName,
        String studentEmail,
        Long courseId,
        String courseTitle,
        String courseSubject,
        String reason,
        String priority,
        Instant createdAt,
        Instant updatedAt
) {
    public static TeacherRecommendationDto from(TeacherRecommendation r) {
        String teacherName = (r.getTeacher().getFirstName() + " " + r.getTeacher().getLastName()).trim();
        String studentName = (r.getStudent().getFirstName() + " " + r.getStudent().getLastName()).trim();
        return new TeacherRecommendationDto(
                r.getId(),
                r.getTeacher().getId(),
                teacherName,
                r.getStudent().getId(),
                studentName,
                r.getStudent().getEmail(),
                r.getCourse().getId(),
                r.getCourse().getTitle(),
                r.getCourse().getSubject(),
                r.getReason(),
                r.getPriority(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}

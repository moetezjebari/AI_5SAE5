package com.aisae.lms.progress;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentCourseProgressRepository extends JpaRepository<StudentCourseProgress, Long> {
    Optional<StudentCourseProgress> findByStudentIdAndCourseId(Long studentId, Long courseId);
    List<StudentCourseProgress> findByStudentId(Long studentId);
    List<StudentCourseProgress> findByStudentIdAndStatus(Long studentId, ProgressStatus status);
}

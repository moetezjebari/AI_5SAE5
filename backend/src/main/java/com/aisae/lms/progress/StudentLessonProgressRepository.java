package com.aisae.lms.progress;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentLessonProgressRepository extends JpaRepository<StudentLessonProgress, Long> {
    Optional<StudentLessonProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId);
    List<StudentLessonProgress> findByStudentIdAndLessonCourseId(Long studentId, Long courseId);
}

package com.aisae.lms.progress;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LearningActivityRepository extends JpaRepository<LearningActivity, Long> {
    List<LearningActivity> findByStudentIdOrderByCreatedAtDesc(Long studentId, Pageable pageable);
    List<LearningActivity> findByStudentIdAndCourseId(Long studentId, Long courseId);
}

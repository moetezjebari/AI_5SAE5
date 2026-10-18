package com.aisae.lms.course;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseLessonRepository extends JpaRepository<CourseLesson, Long> {
    List<CourseLesson> findByCourseIdOrderByPosition(Long courseId);

    @Query("""
        SELECT l FROM CourseLesson l
        WHERE l.topic = :topic AND l.course.status = com.aisae.lms.course.CourseStatus.PUBLISHED
        """)
    List<CourseLesson> findPublishedByTopic(@Param("topic") String topic);
}

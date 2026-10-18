package com.aisae.lms.quiz;

import com.aisae.lms.course.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

    @Query("""
        SELECT q FROM Quiz q
        WHERE (:courseId IS NULL OR q.course.id = :courseId)
          AND (:status IS NULL OR q.status = :status)
        """)
    Page<Quiz> search(@Param("courseId") Long courseId, @Param("status") CourseStatus status, Pageable pageable);

    List<Quiz> findByCourseIdAndStatus(Long courseId, CourseStatus status);

    @Query("""
        SELECT DISTINCT q FROM Quiz q JOIN q.questions qq
        WHERE qq.topic = :topic AND q.status = com.aisae.lms.course.CourseStatus.PUBLISHED
        """)
    List<Quiz> findPublishedByQuestionTopic(@Param("topic") String topic);

    @Query("""
        SELECT q FROM Quiz q JOIN FETCH q.course c
        WHERE q.status = :status AND c.status = :status
        ORDER BY q.id ASC
        """)
    List<Quiz> findPublishedWithCourse(@Param("status") CourseStatus status);
}

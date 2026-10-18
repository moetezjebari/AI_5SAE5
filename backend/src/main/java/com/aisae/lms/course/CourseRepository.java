package com.aisae.lms.course;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    @Query("""
        SELECT c FROM Course c
        WHERE (:status IS NULL OR c.status = :status)
          AND (:subject IS NULL OR c.subject = :subject)
          AND (:level IS NULL OR c.level = :level)
          AND (:search IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')))
        """)
    Page<Course> search(@Param("status") CourseStatus status,
                         @Param("subject") String subject,
                         @Param("level") CourseLevel level,
                         @Param("search") String search,
                         Pageable pageable);

    List<Course> findByStatus(CourseStatus status);
}

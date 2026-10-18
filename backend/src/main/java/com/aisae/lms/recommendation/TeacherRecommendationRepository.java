package com.aisae.lms.recommendation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeacherRecommendationRepository extends JpaRepository<TeacherRecommendation, Long> {

    @Query("SELECT r FROM TeacherRecommendation r JOIN FETCH r.teacher JOIN FETCH r.student JOIN FETCH r.course WHERE r.teacher.id = :teacherId ORDER BY r.createdAt DESC")
    List<TeacherRecommendation> findByTeacherId(@Param("teacherId") Long teacherId);

    @Query("SELECT r FROM TeacherRecommendation r JOIN FETCH r.teacher JOIN FETCH r.student JOIN FETCH r.course ORDER BY r.createdAt DESC")
    List<TeacherRecommendation> findAllWithDetails();

    @Query("SELECT r FROM TeacherRecommendation r JOIN FETCH r.teacher JOIN FETCH r.student JOIN FETCH r.course WHERE r.student.id = :studentId ORDER BY r.createdAt DESC")
    List<TeacherRecommendation> findByStudentId(@Param("studentId") Long studentId);

    Optional<TeacherRecommendation> findByIdAndTeacherId(Long id, Long teacherId);
}

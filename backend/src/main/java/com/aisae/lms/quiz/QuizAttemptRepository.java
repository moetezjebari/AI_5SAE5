package com.aisae.lms.quiz;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByStudentIdOrderByStartedAtDesc(Long studentId);

    List<QuizAttempt> findByStudentIdAndStatusOrderByStartedAtDesc(Long studentId, AttemptStatus status);

    List<QuizAttempt> findByStudentIdAndQuizIdOrderByStartedAtDesc(Long studentId, Long quizId);

    Optional<QuizAttempt> findByIdAndStudentId(Long id, Long studentId);

    long countByStudentIdAndQuizIdAndStatus(Long studentId, Long quizId, AttemptStatus status);
}

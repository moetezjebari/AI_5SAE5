package com.aisae.lms.analytics;

import com.aisae.lms.analytics.dto.DashboardStatsDto;
import com.aisae.lms.analytics.dto.ScoreTrendPointDto;
import com.aisae.lms.analytics.dto.TopicPerformanceDto;
import com.aisae.lms.progress.ProgressService;
import com.aisae.lms.progress.ProgressStatus;
import com.aisae.lms.progress.StudentCourseProgress;
import com.aisae.lms.progress.dto.CourseProgressDto;
import com.aisae.lms.progress.dto.LearningActivityDto;
import com.aisae.lms.quiz.AttemptStatus;
import com.aisae.lms.quiz.QuizAnswer;
import com.aisae.lms.quiz.QuizAnswerRepository;
import com.aisae.lms.quiz.QuizAttempt;
import com.aisae.lms.quiz.QuizAttemptRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * All indicators here are computed from verified quiz_attempts / quiz_answers / progress
 * records only — nothing is fabricated when a student has no history yet.
 */
@Service
public class PerformanceService {

    /** A topic needs at least this many answered questions before we call it a strength or weakness. */
    private static final int MIN_EVIDENCE_THRESHOLD = 3;
    private static final BigDecimal STRONG_THRESHOLD = BigDecimal.valueOf(75);
    private static final BigDecimal WEAK_THRESHOLD = BigDecimal.valueOf(50);

    private final ProgressService progressService;
    private final QuizAttemptRepository attemptRepository;
    private final QuizAnswerRepository answerRepository;

    public PerformanceService(ProgressService progressService, QuizAttemptRepository attemptRepository,
                               QuizAnswerRepository answerRepository) {
        this.progressService = progressService;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
    }

    public DashboardStatsDto computeDashboard(Long studentId) {
        List<StudentCourseProgress> progressList = progressService.listProgressForStudent(studentId);
        List<CourseProgressDto> courseProgress = progressList.stream().map(CourseProgressDto::from).toList();

        int completed = (int) progressList.stream().filter(p -> p.getStatus() == ProgressStatus.COMPLETED).count();
        int inProgress = (int) progressList.stream().filter(p -> p.getStatus() == ProgressStatus.IN_PROGRESS).count();

        BigDecimal overallProgress = progressList.isEmpty() ? BigDecimal.ZERO
                : progressList.stream().map(StudentCourseProgress::getProgressPercent)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(progressList.size()), 2, RoundingMode.HALF_UP);

        List<QuizAttempt> submittedAttempts = attemptRepository
                .findByStudentIdAndStatusOrderByStartedAtDesc(studentId, AttemptStatus.SUBMITTED);

        BigDecimal averageScore = computeAverageScorePercent(submittedAttempts);

        List<ScoreTrendPointDto> scoreTrend = submittedAttempts.stream()
                .sorted(Comparator.comparing(QuizAttempt::getSubmittedAt))
                .map(a -> new ScoreTrendPointDto(a.getId(), a.getQuiz().getTitle(), a.getQuiz().getCourse().getTitle(),
                        scorePercentOf(a), a.getSubmittedAt()))
                .toList();

        List<LearningActivityDto> activities = progressService.listRecentActivities(studentId, 15)
                .stream().map(LearningActivityDto::from).toList();

        List<TopicPerformanceDto> topics = computeTopicPerformance(studentId);
        List<TopicPerformanceDto> strengths = topics.stream()
                .filter(t -> "STRONG".equals(t.classification())).toList();
        List<TopicPerformanceDto> weaknesses = topics.stream()
                .filter(t -> "WEAK".equals(t.classification())).toList();

        return new DashboardStatsDto(
                progressList.size(), completed, inProgress, overallProgress, averageScore,
                submittedAttempts.size(), courseProgress, activities, scoreTrend, strengths, weaknesses
        );
    }

    public List<TopicPerformanceDto> computeTopicPerformance(Long studentId) {
        List<QuizAnswer> answers = answerRepository.findByAttemptStudentId(studentId).stream()
                .filter(a -> a.getAttempt().getStatus() == AttemptStatus.SUBMITTED)
                .toList();

        Map<String, List<QuizAnswer>> byTopic = answers.stream()
                .filter(a -> a.getQuestion().getTopic() != null && !a.getQuestion().getTopic().isBlank())
                .collect(Collectors.groupingBy(a -> a.getQuestion().getTopic()));

        List<TopicPerformanceDto> result = new ArrayList<>();
        for (Map.Entry<String, List<QuizAnswer>> entry : byTopic.entrySet()) {
            List<QuizAnswer> topicAnswers = entry.getValue();
            int total = topicAnswers.size();
            int correct = (int) topicAnswers.stream().filter(a -> Boolean.TRUE.equals(a.getCorrect())).count();
            BigDecimal accuracy = total == 0 ? BigDecimal.ZERO
                    : BigDecimal.valueOf(correct).multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);

            boolean sufficientEvidence = total >= MIN_EVIDENCE_THRESHOLD;
            String classification;
            if (!sufficientEvidence) {
                classification = "INSUFFICIENT_EVIDENCE";
            } else if (accuracy.compareTo(STRONG_THRESHOLD) >= 0) {
                classification = "STRONG";
            } else if (accuracy.compareTo(WEAK_THRESHOLD) < 0) {
                classification = "WEAK";
            } else {
                classification = "NEUTRAL";
            }

            result.add(new TopicPerformanceDto(entry.getKey(), total, correct, accuracy, sufficientEvidence, classification));
        }
        result.sort(Comparator.comparing(TopicPerformanceDto::accuracyPercent));
        return result;
    }

    private BigDecimal computeAverageScorePercent(List<QuizAttempt> submittedAttempts) {
        if (submittedAttempts.isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal sum = submittedAttempts.stream().map(this::scorePercentOf)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(submittedAttempts.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal scorePercentOf(QuizAttempt attempt) {
        if (attempt.getScore() == null || attempt.getTotalPossibleScore() == null
                || attempt.getTotalPossibleScore().compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return attempt.getScore().multiply(BigDecimal.valueOf(100))
                .divide(attempt.getTotalPossibleScore(), 2, RoundingMode.HALF_UP);
    }
}

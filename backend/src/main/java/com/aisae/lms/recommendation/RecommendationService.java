package com.aisae.lms.recommendation;

import com.aisae.lms.analytics.PerformanceService;
import com.aisae.lms.analytics.dto.TopicPerformanceDto;
import com.aisae.lms.common.ApiException;
import com.aisae.lms.course.Course;
import com.aisae.lms.course.CourseLesson;
import com.aisae.lms.course.CourseLessonRepository;
import com.aisae.lms.course.CourseRepository;
import com.aisae.lms.course.CourseStatus;
import com.aisae.lms.progress.ProgressService;
import com.aisae.lms.progress.ProgressStatus;
import com.aisae.lms.progress.StudentCourseProgress;
import com.aisae.lms.quiz.AttemptStatus;
import com.aisae.lms.quiz.Quiz;
import com.aisae.lms.quiz.QuizAttempt;
import com.aisae.lms.quiz.QuizAttemptRepository;
import com.aisae.lms.quiz.QuizRepository;
import com.aisae.lms.user.Role;
import com.aisae.lms.user.User;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Hybrid recommendation engine: the backend deterministically picks real, verified
 * course/quiz candidates from the database; Gemini (when configured) is only used to
 * phrase encouraging explanations around that fixed candidate set. The LLM never invents
 * resource ids, grades anything, or changes historical records.
 */
@Service
public class RecommendationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);
    private static final int MAX_RECOMMENDATIONS = 5;

    private final PerformanceService performanceService;
    private final ProgressService progressService;
    private final CourseRepository courseRepository;
    private final CourseLessonRepository courseLessonRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository attemptRepository;
    private final TeacherRecommendationRepository teacherRecommendationRepository;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public RecommendationService(PerformanceService performanceService, ProgressService progressService,
                                  CourseRepository courseRepository, CourseLessonRepository courseLessonRepository,
                                  QuizRepository quizRepository, QuizAttemptRepository attemptRepository,
                                  TeacherRecommendationRepository teacherRecommendationRepository,
                                  GeminiClient geminiClient, ObjectMapper objectMapper) {
        this.performanceService = performanceService;
        this.progressService = progressService;
        this.courseRepository = courseRepository;
        this.courseLessonRepository = courseLessonRepository;
        this.quizRepository = quizRepository;
        this.attemptRepository = attemptRepository;
        this.teacherRecommendationRepository = teacherRecommendationRepository;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    public com.aisae.lms.recommendation.dto.RecommendationResponseDto generate(User student) {
        if (student.getRole() != Role.STUDENT) {
            throw ApiException.badRequest("Les recommandations sont réservées aux étudiants");
        }

        List<Candidate> candidates = buildCandidates(student);

        com.aisae.lms.recommendation.dto.RecommendationResponseDto baseResponse = null;
        if (geminiClient.isConfigured()) {
            try {
                String response = callGeminiForExplanations(student, candidates);
                if (response != null) {
                    baseResponse = parseGeminiResponse(response, candidates);
                }
            } catch (Exception ex) {
                log.warn("Génération Gemini indisponible, bascule sur les recommandations déterministes : {}", ex.getMessage());
            }
        }

        if (baseResponse == null) {
            baseResponse = buildFallbackResponse(candidates);
        }

        return mergeTeacherRecommendations(student, baseResponse);
    }

    private com.aisae.lms.recommendation.dto.RecommendationResponseDto mergeTeacherRecommendations(
            User student, com.aisae.lms.recommendation.dto.RecommendationResponseDto base) {
        List<TeacherRecommendation> teacherRecs = teacherRecommendationRepository.findByStudentId(student.getId());
        if (teacherRecs.isEmpty()) {
            return base;
        }

        Set<Long> teacherCourseIds = new HashSet<>();
        List<com.aisae.lms.recommendation.dto.RecommendationItemDto> combined = new ArrayList<>();

        for (TeacherRecommendation tr : teacherRecs) {
            teacherCourseIds.add(tr.getCourse().getId());
            String teacherName = (tr.getTeacher().getFirstName() + " " + tr.getTeacher().getLastName()).trim();
            String reason = "Recommandé par votre enseignant " + teacherName + " : " + tr.getReason();
            combined.add(new com.aisae.lms.recommendation.dto.RecommendationItemDto(
                    "COURSE",
                    tr.getCourse().getId(),
                    tr.getCourse().getTitle(),
                    reason,
                    tr.getPriority() != null ? tr.getPriority() : "HIGH",
                    "OPEN_COURSE"
            ));
        }

        // Add automated candidates if not already covered by teacher recommendation
        for (com.aisae.lms.recommendation.dto.RecommendationItemDto item : base.recommendations()) {
            if ("COURSE".equals(item.type()) && teacherCourseIds.contains(item.resourceId())) {
                continue;
            }
            combined.add(item);
        }

        String summary = String.format("⭐ Vous avez %d recommandation(s) directe(s) de votre enseignant. %s",
                teacherRecs.size(), base.summary() != null ? base.summary() : "");

        return new com.aisae.lms.recommendation.dto.RecommendationResponseDto(
                summary.trim(),
                combined,
                base.source(),
                base.modelUsed(),
                base.generatedAt()
        );
    }

    // ---- Candidate selection (deterministic, grounded in real DB content) ----

    private List<Candidate> buildCandidates(User student) {
        List<TopicPerformanceDto> topics = performanceService.computeTopicPerformance(student.getId());
        List<StudentCourseProgress> progress = progressService.listProgressForStudent(student.getId());
        Set<Long> startedCourseIds = progress.stream().map(p -> p.getCourse().getId()).collect(Collectors.toSet());
        Set<Long> completedCourseIds = progress.stream()
                .filter(p -> p.getStatus() == ProgressStatus.COMPLETED)
                .map(p -> p.getCourse().getId()).collect(Collectors.toSet());

        List<Candidate> candidates = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        List<TopicPerformanceDto> weak = topics.stream().filter(t -> "WEAK".equals(t.classification())).toList();
        for (TopicPerformanceDto topic : weak) {
            addLessonCandidateForTopic(topic, completedCourseIds, candidates, seen, "HIGH");
            addQuizCandidateForTopic(topic, student, candidates, seen, "HIGH");
            if (candidates.size() >= MAX_RECOMMENDATIONS) break;
        }

        if (candidates.size() < MAX_RECOMMENDATIONS) {
            List<TopicPerformanceDto> strong = topics.stream().filter(t -> "STRONG".equals(t.classification())).toList();
            for (TopicPerformanceDto topic : strong) {
                addNextCourseCandidate(startedCourseIds, candidates, seen, topic.topic());
                if (candidates.size() >= MAX_RECOMMENDATIONS) break;
            }
        }

        if (candidates.isEmpty()) {
            // No evidence yet: point the student at published, not-yet-started courses to begin with.
            List<Course> published = courseRepository.findByStatus(CourseStatus.PUBLISHED);
            for (Course course : published) {
                if (!startedCourseIds.contains(course.getId()) && candidates.size() < 2) {
                    String key = "COURSE:" + course.getId();
                    if (seen.add(key)) {
                        candidates.add(new Candidate("COURSE", course.getId(), course.getTitle(), "MEDIUM", "OPEN_COURSE",
                                null, "Ce cours correspond à votre niveau et constitue un bon point de départ."));
                    }
                }
            }
        }

        return candidates.stream().limit(MAX_RECOMMENDATIONS).toList();
    }

    private void addLessonCandidateForTopic(TopicPerformanceDto topic, Set<Long> completedCourseIds,
                                             List<Candidate> candidates, Set<String> seen, String priority) {
        List<CourseLesson> lessons = courseLessonRepository.findPublishedByTopic(topic.topic());
        for (CourseLesson lesson : lessons) {
            Course course = lesson.getCourse();
            if (completedCourseIds.contains(course.getId())) continue;
            String key = "COURSE:" + course.getId();
            if (seen.add(key)) {
                String reason = String.format(
                        "Vos résultats récents montrent une précision de %.0f%% sur le thème \"%s\" : revoir \"%s\" devrait aider.",
                        topic.accuracyPercent().doubleValue(), topic.topic(), lesson.getTitle());
                candidates.add(new Candidate("COURSE", course.getId(), course.getTitle(), priority, "OPEN_COURSE",
                        topic.topic(), reason));
                return;
            }
        }
    }

    private void addQuizCandidateForTopic(TopicPerformanceDto topic, User student,
                                           List<Candidate> candidates, Set<String> seen, String priority) {
        List<Quiz> quizzes = quizRepository.findPublishedByQuestionTopic(topic.topic());
        for (Quiz quiz : quizzes) {
            if (hasPassedQuiz(student.getId(), quiz.getId())) continue;
            String key = "QUIZ:" + quiz.getId();
            if (seen.add(key)) {
                String reason = String.format(
                        "Ce quiz couvre le thème \"%s\" où une révision ciblée peut consolider vos acquis.",
                        topic.topic());
                candidates.add(new Candidate("QUIZ", quiz.getId(), quiz.getTitle(), priority, "START_QUIZ",
                        topic.topic(), reason));
                return;
            }
        }
    }

    private void addNextCourseCandidate(Set<Long> startedCourseIds, List<Candidate> candidates,
                                         Set<String> seen, String topic) {
        List<Course> published = courseRepository.findByStatus(CourseStatus.PUBLISHED);
        for (Course course : published) {
            if (startedCourseIds.contains(course.getId())) continue;
            String key = "COURSE:" + course.getId();
            if (seen.add(key)) {
                candidates.add(new Candidate("COURSE", course.getId(), course.getTitle(), "MEDIUM", "OPEN_COURSE",
                        topic, "Vos bons résultats sur ce thème suggèrent que vous êtes prêt pour cette suite logique."));
                return;
            }
        }
    }

    private boolean hasPassedQuiz(Long studentId, Long quizId) {
        List<QuizAttempt> attempts = attemptRepository.findByStudentIdAndQuizIdOrderByStartedAtDesc(studentId, quizId);
        return attempts.stream().anyMatch(a -> a.getStatus() == AttemptStatus.SUBMITTED
                && a.getScore() != null && a.getTotalPossibleScore() != null
                && a.getTotalPossibleScore().compareTo(BigDecimal.ZERO) > 0
                && a.getScore().multiply(BigDecimal.valueOf(100)).divide(a.getTotalPossibleScore(), 2, RoundingMode.HALF_UP)
                    .compareTo(a.getQuiz().getPassingScore()) >= 0);
    }

    // ---- Gemini explanation layer ----

    private String callGeminiForExplanations(User student, List<Candidate> candidates) {
        if (candidates.isEmpty()) {
            return null;
        }
        StringBuilder candidateBlock = new StringBuilder();
        for (Candidate c : candidates) {
            candidateBlock.append(String.format("- resourceId=%d, type=%s, title=\"%s\", topic=%s%n",
                    c.resourceId(), c.type(), c.title(), c.topic() != null ? c.topic() : "N/A"));
        }

        String prompt = String.format("""
                Tu es un tuteur pédagogique bienveillant. Un(e) étudiant(e) de niveau %s a le profil de performance suivant
                (données anonymisées, sans aucune information personnelle) :
                %s

                Voici une liste FIXE de ressources déjà sélectionnées par le système (tu ne dois NI en ajouter NI en retirer,
                NI changer leur resourceId) :
                %s

                Réponds STRICTEMENT en JSON, sans aucun texte autour, avec ce format exact :
                {
                  "summary": "une phrase d'encouragement résumant les priorités",
                  "recommendations": [
                    { "resourceId": 123, "reason": "explication claire et motivante en français" }
                  ]
                }
                Fournis une entrée "recommendations" pour CHAQUE resourceId listé ci-dessus, dans le même ordre.
                """,
                describeRole(student), describeTopics(candidates), candidateBlock);

        return geminiClient.generateJson(prompt);
    }

    private String describeRole(User student) {
        return "étudiant"; // level isn't modeled on User yet; kept generic and anonymized on purpose
    }

    private String describeTopics(List<Candidate> candidates) {
        return candidates.stream()
                .filter(c -> c.topic() != null)
                .map(c -> "- " + c.topic())
                .distinct()
                .collect(Collectors.joining("\n"));
    }

    private com.aisae.lms.recommendation.dto.RecommendationResponseDto parseGeminiResponse(
            String response, List<Candidate> candidates) {
        try {
            JsonNode root = objectMapper.readTree(response);
            String summary = root.path("summary").asText(defaultSummary(candidates));
            Map<Long, String> reasonsById = new HashMap<>();
            for (JsonNode node : root.path("recommendations")) {
                long id = node.path("resourceId").asLong(-1);
                String reason = node.path("reason").asText(null);
                if (id > 0 && reason != null && !reason.isBlank()) {
                    reasonsById.put(id, reason);
                }
            }

            List<com.aisae.lms.recommendation.dto.RecommendationItemDto> items = candidates.stream()
                    .map(c -> new com.aisae.lms.recommendation.dto.RecommendationItemDto(
                            c.type(), c.resourceId(), c.title(),
                            reasonsById.getOrDefault(c.resourceId(), c.defaultReason()),
                            c.priority(), c.action()))
                    .toList();

            return new com.aisae.lms.recommendation.dto.RecommendationResponseDto(
                    summary, items, "gemini", "Gemini", Instant.now());
        } catch (Exception ex) {
            log.warn("Réponse Gemini illisible, bascule sur les recommandations déterministes : {}", ex.getMessage());
            return buildFallbackResponse(candidates);
        }
    }

    private com.aisae.lms.recommendation.dto.RecommendationResponseDto buildFallbackResponse(List<Candidate> candidates) {
        List<com.aisae.lms.recommendation.dto.RecommendationItemDto> items = candidates.stream()
                .map(c -> new com.aisae.lms.recommendation.dto.RecommendationItemDto(
                        c.type(), c.resourceId(), c.title(), c.defaultReason(), c.priority(), c.action()))
                .toList();
        return new com.aisae.lms.recommendation.dto.RecommendationResponseDto(
                defaultSummary(candidates), items, "fallback", "Moteur de règles déterministe (sans LLM)", Instant.now());
    }

    private String defaultSummary(List<Candidate> candidates) {
        if (candidates.isEmpty()) {
            return "Commencez par explorer les cours publiés pour générer vos premières données de performance.";
        }
        return "Voici les priorités recommandées pour progresser, basées sur vos résultats récents.";
    }
}

package com.aisae.lms.quiz;

import com.aisae.lms.common.ApiException;
import com.aisae.lms.course.Course;
import com.aisae.lms.course.CourseRepository;
import com.aisae.lms.course.CourseStatus;
import com.aisae.lms.progress.ProgressService;
import com.aisae.lms.quiz.dto.*;
import com.aisae.lms.user.Role;
import com.aisae.lms.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private final QuizRepository quizRepository;
    private final CourseRepository courseRepository;
    private final QuizAttemptRepository attemptRepository;
    private final QuizAnswerRepository answerRepository;
    private final ProgressService progressService;

    public QuizService(QuizRepository quizRepository, CourseRepository courseRepository,
                        QuizAttemptRepository attemptRepository, QuizAnswerRepository answerRepository,
                        ProgressService progressService) {
        this.quizRepository = quizRepository;
        this.courseRepository = courseRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.progressService = progressService;
    }

    @Transactional(readOnly = true)
    public Page<QuizDto> search(Long courseId, CourseStatus status, User requester, Pageable pageable) {
        CourseStatus effectiveStatus = (requester == null || requester.getRole() == Role.STUDENT) ? CourseStatus.PUBLISHED : status;
        return quizRepository.search(courseId, effectiveStatus, pageable).map(QuizDto::summary);
    }

    @Transactional(readOnly = true)
    public QuizDto getForManagement(Long id, User requester) {
        requireTeacherOrAdmin(requester);
        Quiz quiz = loadQuiz(id);
        requireOwnerOrAdmin(quiz, requester);
        return QuizDto.forManagement(quiz);
    }

    @Transactional(readOnly = true)
    public QuizDto getForTaking(Long id, User student) {
        Quiz quiz = loadQuiz(id);
        if (quiz.getStatus() != CourseStatus.PUBLISHED) {
            throw ApiException.notFound("Quiz introuvable");
        }
        return QuizDto.forTaking(quiz);
    }

    @Transactional
    public QuizDto create(QuizUpsertRequest request, User author) {
        requireTeacherOrAdmin(author);
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> ApiException.notFound("Cours introuvable"));

        Quiz quiz = new Quiz();
        quiz.setCourse(course);
        quiz.setCreatedBy(author);
        applyRequest(quiz, request);
        Quiz saved = quizRepository.save(quiz);
        return QuizDto.forManagement(saved);
    }

    @Transactional
    public QuizDto update(Long id, QuizUpsertRequest request, User author) {
        requireTeacherOrAdmin(author);
        Quiz quiz = loadQuiz(id);
        requireOwnerOrAdmin(quiz, author);

        if (!quiz.getCourse().getId().equals(request.courseId())) {
            Course course = courseRepository.findById(request.courseId())
                    .orElseThrow(() -> ApiException.notFound("Cours introuvable"));
            quiz.setCourse(course);
        }
        applyRequest(quiz, request);
        Quiz saved = quizRepository.save(quiz);
        return QuizDto.forManagement(saved);
    }

    @Transactional
    public void archive(Long id, User author) {
        requireTeacherOrAdmin(author);
        Quiz quiz = loadQuiz(id);
        requireOwnerOrAdmin(quiz, author);
        // Archive rather than delete: historical attempts/answers referencing this quiz must survive.
        quiz.setStatus(CourseStatus.ARCHIVED);
        quizRepository.save(quiz);
    }

    @Transactional
    public AttemptResultDto startAttempt(Long quizId, User student) {
        Quiz quiz = loadQuiz(quizId);
        if (quiz.getStatus() != CourseStatus.PUBLISHED) {
            throw ApiException.notFound("Quiz introuvable");
        }
        QuizAttempt attempt = new QuizAttempt();
        attempt.setStudent(student);
        attempt.setQuiz(quiz);
        attempt.setStatus(AttemptStatus.IN_PROGRESS);
        QuizAttempt saved = attemptRepository.save(attempt);
        return toResultDto(saved, false);
    }

    @Transactional
    public AttemptResultDto submitAttempt(Long attemptId, SubmitAttemptRequest request, User student) {
        QuizAttempt attempt = attemptRepository.findByIdAndStudentId(attemptId, student.getId())
                .orElseThrow(() -> ApiException.notFound("Tentative introuvable"));
        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {
            throw ApiException.conflict("Cette tentative a déjà été soumise");
        }

        Quiz quiz = attempt.getQuiz();
        Map<Long, QuizQuestion> questionsById = quiz.getQuestions().stream()
                .collect(Collectors.toMap(QuizQuestion::getId, q -> q));

        Map<Long, AnswerSubmissionDto> submittedByQuestion = request.answers().stream()
                .collect(Collectors.toMap(AnswerSubmissionDto::questionId, a -> a, (a, b) -> a));

        BigDecimal totalPossible = BigDecimal.ZERO;
        BigDecimal totalEarned = BigDecimal.ZERO;
        int correctCount = 0;
        List<QuizAnswer> answers = new ArrayList<>();

        for (QuizQuestion question : quiz.getQuestions()) {
            totalPossible = totalPossible.add(BigDecimal.valueOf(question.getPoints()));

            Set<Long> correctOptionIds = question.getOptions().stream()
                    .filter(QuizOption::isCorrect).map(QuizOption::getId).collect(Collectors.toSet());

            AnswerSubmissionDto submitted = submittedByQuestion.get(question.getId());
            Set<Long> selectedIds = submitted != null ? new HashSet<>(submitted.selectedOptionIds()) : Set.of();

            boolean isCorrect = !selectedIds.isEmpty() && selectedIds.equals(correctOptionIds);

            QuizAnswer answer = new QuizAnswer();
            answer.setAttempt(attempt);
            answer.setQuestion(question);
            answer.setCorrect(isCorrect);
            answer.setPointsEarned(isCorrect ? BigDecimal.valueOf(question.getPoints()) : BigDecimal.ZERO);
            Set<QuizOption> selectedOptions = question.getOptions().stream()
                    .filter(o -> selectedIds.contains(o.getId())).collect(Collectors.toSet());
            answer.setSelectedOptions(selectedOptions);
            answers.add(answer);

            if (isCorrect) {
                correctCount++;
                totalEarned = totalEarned.add(BigDecimal.valueOf(question.getPoints()));
            }
        }

        attempt.getAnswers().clear();
        attempt.getAnswers().addAll(answers);
        attempt.setScore(totalEarned);
        attempt.setTotalPossibleScore(totalPossible);
        attempt.setCorrectCount(correctCount);
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(Instant.now());
        attempt.setTimeSpentSeconds(request.timeSpentSeconds());

        QuizAttempt saved = attemptRepository.save(attempt);
        progressService.recordQuizAttempt(student, quiz);

        return toResultDto(saved, true);
    }

    public AttemptResultDto getAttemptResult(Long attemptId, User student) {
        QuizAttempt attempt = attemptRepository.findByIdAndStudentId(attemptId, student.getId())
                .orElseThrow(() -> ApiException.notFound("Tentative introuvable"));
        return toResultDto(attempt, attempt.getStatus() == AttemptStatus.SUBMITTED);
    }

    public List<AttemptResultDto> listMyAttempts(User student, Long quizId) {
        List<QuizAttempt> attempts = quizId != null
                ? attemptRepository.findByStudentIdAndQuizIdOrderByStartedAtDesc(student.getId(), quizId)
                : attemptRepository.findByStudentIdOrderByStartedAtDesc(student.getId());
        return attempts.stream().map(a -> toResultDto(a, a.getStatus() == AttemptStatus.SUBMITTED)).toList();
    }

    private AttemptResultDto toResultDto(QuizAttempt attempt, boolean revealAnswers) {
        Quiz quiz = attempt.getQuiz();
        BigDecimal scorePercent = BigDecimal.ZERO;
        if (attempt.getScore() != null && attempt.getTotalPossibleScore() != null
                && attempt.getTotalPossibleScore().compareTo(BigDecimal.ZERO) > 0) {
            scorePercent = attempt.getScore().multiply(BigDecimal.valueOf(100))
                    .divide(attempt.getTotalPossibleScore(), 2, RoundingMode.HALF_UP);
        }
        boolean passed = scorePercent.compareTo(quiz.getPassingScore()) >= 0;

        List<AttemptAnswerResultDto> answerDtos = revealAnswers
                ? attempt.getAnswers().stream().map(a -> new AttemptAnswerResultDto(
                        a.getQuestion().getId(), a.getQuestion().getQuestionText(), a.getQuestion().getTopic(),
                        Boolean.TRUE.equals(a.getCorrect()), a.getPointsEarned(),
                        a.getSelectedOptions().stream().map(QuizOption::getId).toList(),
                        a.getQuestion().getOptions().stream().filter(QuizOption::isCorrect).map(QuizOption::getId).toList()
                )).toList()
                : List.of();

        return new AttemptResultDto(
                attempt.getId(), quiz.getId(), quiz.getTitle(), quiz.getCourse().getId(), quiz.getCourse().getTitle(),
                attempt.getStatus(), attempt.getScore(), attempt.getTotalPossibleScore(), scorePercent,
                attempt.getCorrectCount(), quiz.getQuestions().size(), revealAnswers && passed,
                attempt.getStartedAt(), attempt.getSubmittedAt(), attempt.getTimeSpentSeconds(), answerDtos
        );
    }

    private void applyRequest(Quiz quiz, QuizUpsertRequest request) {
        quiz.setTitle(request.title().trim());
        quiz.setDescription(request.description());
        quiz.setDifficulty(request.difficulty());
        quiz.setDurationMinutes(request.durationMinutes());
        quiz.setPassingScore(request.passingScore());
        quiz.setStatus(request.status());

        List<QuizQuestion> questions = new ArrayList<>();
        for (QuizQuestionDto qDto : request.questions()) {
            QuizQuestion question = new QuizQuestion();
            question.setQuiz(quiz);
            question.setQuestionText(qDto.questionText());
            question.setQuestionType(qDto.questionType() != null ? qDto.questionType() : QuestionType.SINGLE_CHOICE);
            question.setTopic(qDto.topic());
            question.setPoints(Math.max(1, qDto.points()));
            question.setPosition(qDto.position());

            List<QuizOption> options = new ArrayList<>();
            for (QuizOptionDto oDto : qDto.options()) {
                QuizOption option = new QuizOption();
                option.setQuestion(question);
                option.setOptionText(oDto.optionText());
                option.setCorrect(Boolean.TRUE.equals(oDto.correct()));
                option.setPosition(oDto.position());
                options.add(option);
            }
            if (options.stream().noneMatch(QuizOption::isCorrect)) {
                throw ApiException.badRequest("Chaque question doit avoir au moins une bonne réponse");
            }
            question.getOptions().clear();
            question.getOptions().addAll(options);
            questions.add(question);
        }
        quiz.getQuestions().clear();
        quiz.getQuestions().addAll(questions);
    }

    private Quiz loadQuiz(Long id) {
        return quizRepository.findById(id).orElseThrow(() -> ApiException.notFound("Quiz introuvable"));
    }

    private void requireTeacherOrAdmin(User user) {
        if (user.getRole() != Role.TEACHER && user.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("Seuls les enseignants et administrateurs peuvent gérer les quiz");
        }
    }

    private void requireOwnerOrAdmin(Quiz quiz, User user) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (!quiz.getCreatedBy().getId().equals(user.getId())) {
            throw ApiException.forbidden("Vous ne pouvez modifier que vos propres quiz");
        }
    }
}

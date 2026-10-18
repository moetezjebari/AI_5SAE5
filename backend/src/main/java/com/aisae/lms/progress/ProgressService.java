package com.aisae.lms.progress;

import com.aisae.lms.common.ApiException;
import com.aisae.lms.course.Course;
import com.aisae.lms.course.CourseLesson;
import com.aisae.lms.course.CourseLessonRepository;
import com.aisae.lms.course.CourseRepository;
import com.aisae.lms.quiz.Quiz;
import com.aisae.lms.user.User;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
public class ProgressService {

    private final StudentCourseProgressRepository courseProgressRepository;
    private final StudentLessonProgressRepository lessonProgressRepository;
    private final LearningActivityRepository activityRepository;
    private final CourseLessonRepository courseLessonRepository;
    private final CourseRepository courseRepository;

    public ProgressService(StudentCourseProgressRepository courseProgressRepository,
                            StudentLessonProgressRepository lessonProgressRepository,
                            LearningActivityRepository activityRepository,
                            CourseLessonRepository courseLessonRepository,
                            CourseRepository courseRepository) {
        this.courseProgressRepository = courseProgressRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.activityRepository = activityRepository;
        this.courseLessonRepository = courseLessonRepository;
        this.courseRepository = courseRepository;
    }

    @Transactional
    public StudentCourseProgress ensureEnrolled(User student, Course course) {
        return courseProgressRepository.findByStudentIdAndCourseId(student.getId(), course.getId())
                .orElseGet(() -> {
                    StudentCourseProgress progress = new StudentCourseProgress();
                    progress.setStudent(student);
                    progress.setCourse(course);
                    progress.setStatus(ProgressStatus.IN_PROGRESS);
                    progress.setStartedAt(Instant.now());
                    StudentCourseProgress saved = courseProgressRepository.save(progress);
                    recordActivity(student, ActivityType.COURSE_STARTED, course, null, null,
                            "A commencé le cours \"" + course.getTitle() + "\"");
                    return saved;
                });
    }

    @Transactional
    public void completeLesson(User student, Long courseId, Long lessonId) {
        CourseLesson lesson = courseLessonRepository.findById(lessonId)
                .orElseThrow(() -> ApiException.notFound("Leçon introuvable"));
        if (!lesson.getCourse().getId().equals(courseId)) {
            throw ApiException.badRequest("Cette leçon n'appartient pas au cours indiqué");
        }
        Course course = lesson.getCourse();
        ensureEnrolled(student, course);

        StudentLessonProgress lessonProgress = lessonProgressRepository
                .findByStudentIdAndLessonId(student.getId(), lessonId)
                .orElseGet(() -> {
                    StudentLessonProgress lp = new StudentLessonProgress();
                    lp.setStudent(student);
                    lp.setLesson(lesson);
                    return lp;
                });

        if (!lessonProgress.isCompleted()) {
            lessonProgress.setCompleted(true);
            lessonProgress.setCompletedAt(Instant.now());
            lessonProgressRepository.save(lessonProgress);
            recordActivity(student, ActivityType.LESSON_COMPLETED, course, null, lesson,
                    "A terminé la leçon \"" + lesson.getTitle() + "\"");
        }

        recalculateCourseProgress(student, course);
    }

    @Transactional
    public void recalculateCourseProgress(User student, Course course) {
        List<CourseLesson> lessons = courseLessonRepository.findByCourseIdOrderByPosition(course.getId());
        StudentCourseProgress progress = ensureEnrolled(student, course);

        if (lessons.isEmpty()) {
            return;
        }
        long completed = lessonProgressRepository.findByStudentIdAndLessonCourseId(student.getId(), course.getId())
                .stream().filter(StudentLessonProgress::isCompleted).count();

        BigDecimal percent = BigDecimal.valueOf(completed)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(lessons.size()), 2, RoundingMode.HALF_UP);
        progress.setProgressPercent(percent);

        boolean wasCompleted = progress.getStatus() == ProgressStatus.COMPLETED;
        if (completed == lessons.size()) {
            progress.setStatus(ProgressStatus.COMPLETED);
            if (!wasCompleted) {
                progress.setCompletedAt(Instant.now());
                courseProgressRepository.save(progress);
                recordActivity(student, ActivityType.COURSE_COMPLETED, course, null, null,
                        "A terminé le cours \"" + course.getTitle() + "\"");
                return;
            }
        } else {
            progress.setStatus(ProgressStatus.IN_PROGRESS);
        }
        courseProgressRepository.save(progress);
    }

    @Transactional
    public void recordQuizAttempt(User student, Quiz quiz) {
        Course course = quiz.getCourse();
        ensureEnrolled(student, course);
        recordActivity(student, ActivityType.QUIZ_ATTEMPTED, course, quiz, null,
                "A passé le quiz \"" + quiz.getTitle() + "\"");
    }

    @Transactional
    public void recordActivity(User student, ActivityType type, Course course, Quiz quiz, CourseLesson lesson, String description) {
        LearningActivity activity = new LearningActivity();
        activity.setStudent(student);
        activity.setActivityType(type);
        activity.setCourse(course);
        activity.setQuiz(quiz);
        activity.setLesson(lesson);
        activity.setDescription(description);
        activityRepository.save(activity);
    }

    public List<StudentCourseProgress> listProgressForStudent(Long studentId) {
        return courseProgressRepository.findByStudentId(studentId);
    }

    public List<LearningActivity> listRecentActivities(Long studentId, int limit) {
        return activityRepository.findByStudentIdOrderByCreatedAtDesc(studentId, PageRequest.of(0, limit));
    }
}

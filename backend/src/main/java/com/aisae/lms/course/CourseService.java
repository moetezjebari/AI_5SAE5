package com.aisae.lms.course;

import com.aisae.lms.common.ApiException;
import com.aisae.lms.course.dto.CourseDto;
import com.aisae.lms.course.dto.CourseUpsertRequest;
import com.aisae.lms.course.dto.LessonDto;
import com.aisae.lms.user.Role;
import com.aisae.lms.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Transactional(readOnly = true)
    public Page<CourseDto> search(CourseStatus status, String subject, CourseLevel level, String search,
                                   User requester, Pageable pageable) {
        // Students (and anonymous-equivalent requests) only ever see published courses, regardless of
        // the status filter they pass in — never trust the client to self-restrict.
        CourseStatus effectiveStatus = status;
        if (requester == null || requester.getRole() == Role.STUDENT) {
            effectiveStatus = CourseStatus.PUBLISHED;
        }
        return courseRepository.search(effectiveStatus, subject, level, search, pageable)
                .map(c -> CourseDto.from(c, false));
    }

    @Transactional(readOnly = true)
    public CourseDto getById(Long id, User requester) {
        Course course = loadCourseVisibleTo(id, requester);
        return CourseDto.from(course, true);
    }

    private Course loadCourseVisibleTo(Long id, User requester) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Cours introuvable"));
        if ((requester == null || requester.getRole() == Role.STUDENT) && course.getStatus() != CourseStatus.PUBLISHED) {
            throw ApiException.notFound("Cours introuvable");
        }
        return course;
    }

    @Transactional
    public CourseDto create(CourseUpsertRequest request, User author) {
        requireTeacherOrAdmin(author);
        Course course = new Course();
        applyRequest(course, request);
        course.setCreatedBy(author);
        Course saved = courseRepository.save(course);
        return CourseDto.from(saved, true);
    }

    @Transactional
    public CourseDto update(Long id, CourseUpsertRequest request, User author) {
        requireTeacherOrAdmin(author);
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Cours introuvable"));
        requireOwnerOrAdmin(course, author);
        applyRequest(course, request);
        Course saved = courseRepository.save(course);
        return CourseDto.from(saved, true);
    }

    @Transactional
    public void archive(Long id, User author) {
        requireTeacherOrAdmin(author);
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Cours introuvable"));
        requireOwnerOrAdmin(course, author);
        // Archiving (not hard-deleting) preserves historical quiz attempts and progress records
        // tied to this course's content.
        course.setStatus(CourseStatus.ARCHIVED);
        courseRepository.save(course);
    }

    private void applyRequest(Course course, CourseUpsertRequest request) {
        course.setTitle(request.title().trim());
        course.setDescription(request.description());
        course.setSubject(request.subject().trim());
        course.setLevel(request.level());
        course.setEstimatedDurationMinutes(request.estimatedDurationMinutes());
        course.setStatus(request.status());

        if (request.lessons() != null) {
            List<CourseLesson> lessons = new ArrayList<>();
            for (LessonDto dto : request.lessons()) {
                CourseLesson lesson = new CourseLesson();
                lesson.setCourse(course);
                lesson.setTitle(dto.title());
                lesson.setContent(dto.content());
                lesson.setTopic(dto.topic());
                lesson.setDurationMinutes(dto.durationMinutes());
                lesson.setPosition(dto.position());
                lessons.add(lesson);
            }
            course.getLessons().clear();
            course.getLessons().addAll(lessons);
        }
    }

    private void requireTeacherOrAdmin(User user) {
        if (user.getRole() != Role.TEACHER && user.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("Seuls les enseignants et administrateurs peuvent gérer les cours");
        }
    }

    private void requireOwnerOrAdmin(Course course, User user) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (!course.getCreatedBy().getId().equals(user.getId())) {
            throw ApiException.forbidden("Vous ne pouvez modifier que vos propres cours");
        }
    }
}

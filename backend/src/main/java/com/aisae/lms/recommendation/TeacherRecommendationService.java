package com.aisae.lms.recommendation;

import com.aisae.lms.common.ApiException;
import com.aisae.lms.course.Course;
import com.aisae.lms.course.CourseRepository;
import com.aisae.lms.course.CourseStatus;
import com.aisae.lms.recommendation.dto.CourseOptionDto;
import com.aisae.lms.recommendation.dto.TeacherRecommendationDto;
import com.aisae.lms.recommendation.dto.TeacherRecommendationRequest;
import com.aisae.lms.user.Role;
import com.aisae.lms.user.User;
import com.aisae.lms.user.UserRepository;
import com.aisae.lms.user.UserSummaryDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeacherRecommendationService {

    private final TeacherRecommendationRepository repository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public TeacherRecommendationService(TeacherRecommendationRepository repository,
                                       UserRepository userRepository,
                                       CourseRepository courseRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }

    private void requireTeacherOrAdmin(User user) {
        if (user == null || (user.getRole() != Role.TEACHER && user.getRole() != Role.ADMIN)) {
            throw ApiException.forbidden("Accès réservé aux enseignants et administrateurs");
        }
    }

    @Transactional(readOnly = true)
    public List<TeacherRecommendationDto> listRecommendations(User teacher) {
        requireTeacherOrAdmin(teacher);
        List<TeacherRecommendation> list = (teacher.getRole() == Role.ADMIN)
                ? repository.findAllWithDetails()
                : repository.findByTeacherId(teacher.getId());
        return list.stream().map(TeacherRecommendationDto::from).toList();
    }

    @Transactional(readOnly = true)
    public TeacherRecommendationDto getById(Long id, User teacher) {
        requireTeacherOrAdmin(teacher);
        TeacherRecommendation rec = (teacher.getRole() == Role.ADMIN)
                ? repository.findById(id).orElseThrow(() -> ApiException.notFound("Recommandation introuvable"))
                : repository.findByIdAndTeacherId(id, teacher.getId())
                    .orElseThrow(() -> ApiException.notFound("Recommandation introuvable"));
        return TeacherRecommendationDto.from(rec);
    }

    @Transactional
    public TeacherRecommendationDto create(TeacherRecommendationRequest req, User teacher) {
        requireTeacherOrAdmin(teacher);

        User student = resolveStudent(req);
        Course course = resolveCourse(req);

        TeacherRecommendation rec = new TeacherRecommendation();
        rec.setTeacher(teacher);
        rec.setStudent(student);
        rec.setCourse(course);
        rec.setReason(req.reason().trim());
        rec.setPriority(req.priority() != null && !req.priority().isBlank() ? req.priority().trim().toUpperCase() : "HIGH");

        TeacherRecommendation saved = repository.save(rec);
        return TeacherRecommendationDto.from(saved);
    }

    @Transactional
    public TeacherRecommendationDto update(Long id, TeacherRecommendationRequest req, User teacher) {
        requireTeacherOrAdmin(teacher);

        TeacherRecommendation rec = (teacher.getRole() == Role.ADMIN)
                ? repository.findById(id).orElseThrow(() -> ApiException.notFound("Recommandation introuvable"))
                : repository.findByIdAndTeacherId(id, teacher.getId())
                    .orElseThrow(() -> ApiException.notFound("Recommandation introuvable"));

        User student = resolveStudent(req);
        rec.setStudent(student);

        Course course = resolveCourse(req);
        rec.setCourse(course);

        rec.setReason(req.reason().trim());
        if (req.priority() != null && !req.priority().isBlank()) {
            rec.setPriority(req.priority().trim().toUpperCase());
        }

        TeacherRecommendation updated = repository.save(rec);
        return TeacherRecommendationDto.from(updated);
    }

    private User resolveStudent(TeacherRecommendationRequest req) {
        User student = null;
        if (req.studentId() != null) {
            student = userRepository.findById(req.studentId()).orElse(null);
        }
        if (student == null && req.studentEmail() != null && !req.studentEmail().isBlank()) {
            student = userRepository.findByEmail(req.studentEmail().trim().toLowerCase()).orElse(null);
        }
        if (student == null) {
            throw ApiException.notFound("Étudiant introuvable");
        }
        if (student.getRole() != Role.STUDENT) {
            throw ApiException.badRequest("L'utilisateur sélectionné doit être un étudiant");
        }
        return student;
    }

    private Course resolveCourse(TeacherRecommendationRequest req) {
        Course course = null;
        if (req.courseId() != null) {
            course = courseRepository.findById(req.courseId()).orElse(null);
        }
        if (course == null && req.courseTitle() != null && !req.courseTitle().isBlank()) {
            List<Course> list = courseRepository.findByStatus(CourseStatus.PUBLISHED).stream()
                    .filter(c -> c.getTitle().equalsIgnoreCase(req.courseTitle().trim()))
                    .toList();
            if (!list.isEmpty()) course = list.get(0);
        }
        if (course == null) {
            throw ApiException.notFound("Cours introuvable");
        }
        return course;
    }

    @Transactional
    public void delete(Long id, User teacher) {
        requireTeacherOrAdmin(teacher);

        TeacherRecommendation rec = (teacher.getRole() == Role.ADMIN)
                ? repository.findById(id).orElseThrow(() -> ApiException.notFound("Recommandation introuvable"))
                : repository.findByIdAndTeacherId(id, teacher.getId())
                    .orElseThrow(() -> ApiException.notFound("Recommandation introuvable"));

        repository.delete(rec);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> listStudents(User teacher) {
        requireTeacherOrAdmin(teacher);
        return userRepository.findByRoleOrderByLastNameAscFirstNameAsc(Role.STUDENT)
                .stream().map(UserSummaryDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CourseOptionDto> listAvailableCourses(User teacher) {
        requireTeacherOrAdmin(teacher);
        return courseRepository.findByStatus(CourseStatus.PUBLISHED).stream()
                .map(c -> new CourseOptionDto(c.getId(), c.getTitle(), c.getSubject(), c.getLevel().name()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TeacherRecommendation> listForStudent(Long studentId) {
        return repository.findByStudentId(studentId);
    }
}

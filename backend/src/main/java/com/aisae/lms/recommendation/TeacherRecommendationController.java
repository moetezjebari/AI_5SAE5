package com.aisae.lms.recommendation;

import com.aisae.lms.recommendation.dto.CourseOptionDto;
import com.aisae.lms.recommendation.dto.TeacherRecommendationDto;
import com.aisae.lms.recommendation.dto.TeacherRecommendationRequest;
import com.aisae.lms.user.User;
import com.aisae.lms.user.UserSummaryDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher/recommendations")
public class TeacherRecommendationController {

    private final TeacherRecommendationService service;

    public TeacherRecommendationController(TeacherRecommendationService service) {
        this.service = service;
    }

    @GetMapping
    public List<TeacherRecommendationDto> list(@AuthenticationPrincipal User teacher) {
        return service.listRecommendations(teacher);
    }

    @GetMapping("/{id}")
    public TeacherRecommendationDto get(@PathVariable Long id, @AuthenticationPrincipal User teacher) {
        return service.getById(id, teacher);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TeacherRecommendationDto create(@Valid @RequestBody TeacherRecommendationRequest request,
                                           @AuthenticationPrincipal User teacher) {
        return service.create(request, teacher);
    }

    @PutMapping("/{id}")
    public TeacherRecommendationDto update(@PathVariable Long id,
                                           @Valid @RequestBody TeacherRecommendationRequest request,
                                           @AuthenticationPrincipal User teacher) {
        return service.update(id, request, teacher);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal User teacher) {
        service.delete(id, teacher);
    }

    @GetMapping("/students")
    public List<UserSummaryDto> listStudents(@AuthenticationPrincipal User teacher) {
        return service.listStudents(teacher);
    }

    @GetMapping("/courses")
    public List<CourseOptionDto> listCourses(@AuthenticationPrincipal User teacher) {
        return service.listAvailableCourses(teacher);
    }
}

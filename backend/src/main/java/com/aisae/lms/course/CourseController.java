package com.aisae.lms.course;

import com.aisae.lms.course.dto.CourseDto;
import com.aisae.lms.course.dto.CourseUpsertRequest;
import com.aisae.lms.user.User;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public Page<CourseDto> search(@RequestParam(required = false) CourseStatus status,
                                   @RequestParam(required = false) String subject,
                                   @RequestParam(required = false) CourseLevel level,
                                   @RequestParam(required = false) String search,
                                   @AuthenticationPrincipal User requester,
                                   Pageable pageable) {
        return courseService.search(status, subject, level, search, requester, pageable);
    }

    @GetMapping("/{id}")
    public CourseDto getById(@PathVariable Long id, @AuthenticationPrincipal User requester) {
        return courseService.getById(id, requester);
    }

    @PostMapping
    public ResponseEntity<CourseDto> create(@Valid @RequestBody CourseUpsertRequest request,
                                             @AuthenticationPrincipal User author) {
        return ResponseEntity.ok(courseService.create(request, author));
    }

    @PutMapping("/{id}")
    public CourseDto update(@PathVariable Long id, @Valid @RequestBody CourseUpsertRequest request,
                             @AuthenticationPrincipal User author) {
        return courseService.update(id, request, author);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archive(@PathVariable Long id, @AuthenticationPrincipal User author) {
        courseService.archive(id, author);
        return ResponseEntity.noContent().build();
    }
}

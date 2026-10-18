package com.aisae.lms.quiz;

import com.aisae.lms.course.CourseStatus;
import com.aisae.lms.quiz.dto.*;
import com.aisae.lms.user.User;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @GetMapping
    public Page<QuizDto> search(@RequestParam(required = false) Long courseId,
                                 @RequestParam(required = false) CourseStatus status,
                                 @AuthenticationPrincipal User requester,
                                 Pageable pageable) {
        return quizService.search(courseId, status, requester, pageable);
    }

    @GetMapping("/{id}")
    public QuizDto getForTaking(@PathVariable Long id, @AuthenticationPrincipal User student) {
        return quizService.getForTaking(id, student);
    }

    @GetMapping("/{id}/manage")
    public QuizDto getForManagement(@PathVariable Long id, @AuthenticationPrincipal User requester) {
        return quizService.getForManagement(id, requester);
    }

    @PostMapping
    public ResponseEntity<QuizDto> create(@Valid @RequestBody QuizUpsertRequest request,
                                           @AuthenticationPrincipal User author) {
        return ResponseEntity.ok(quizService.create(request, author));
    }

    @PutMapping("/{id}")
    public QuizDto update(@PathVariable Long id, @Valid @RequestBody QuizUpsertRequest request,
                           @AuthenticationPrincipal User author) {
        return quizService.update(id, request, author);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archive(@PathVariable Long id, @AuthenticationPrincipal User author) {
        quizService.archive(id, author);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/attempts")
    public AttemptResultDto startAttempt(@PathVariable Long id, @AuthenticationPrincipal User student) {
        return quizService.startAttempt(id, student);
    }

    @PostMapping("/attempts/{attemptId}/submit")
    public AttemptResultDto submitAttempt(@PathVariable Long attemptId,
                                           @Valid @RequestBody SubmitAttemptRequest request,
                                           @AuthenticationPrincipal User student) {
        return quizService.submitAttempt(attemptId, request, student);
    }

    @GetMapping("/attempts/{attemptId}")
    public AttemptResultDto getAttempt(@PathVariable Long attemptId, @AuthenticationPrincipal User student) {
        return quizService.getAttemptResult(attemptId, student);
    }

    @GetMapping("/me/attempts")
    public List<AttemptResultDto> myAttempts(@AuthenticationPrincipal User student,
                                              @RequestParam(required = false) Long quizId) {
        return quizService.listMyAttempts(student, quizId);
    }
}

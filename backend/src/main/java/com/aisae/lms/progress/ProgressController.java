package com.aisae.lms.progress;

import com.aisae.lms.progress.dto.CourseProgressDto;
import com.aisae.lms.progress.dto.LearningActivityDto;
import com.aisae.lms.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @PostMapping("/courses/{courseId}/lessons/{lessonId}/complete")
    public void completeLesson(@PathVariable Long courseId, @PathVariable Long lessonId,
                                @AuthenticationPrincipal User student) {
        progressService.completeLesson(student, courseId, lessonId);
    }

    @GetMapping("/me/progress")
    public List<CourseProgressDto> myProgress(@AuthenticationPrincipal User student) {
        return progressService.listProgressForStudent(student.getId()).stream()
                .map(CourseProgressDto::from).toList();
    }

    @GetMapping("/me/activities")
    public List<LearningActivityDto> myActivities(@AuthenticationPrincipal User student,
                                                    @RequestParam(defaultValue = "20") int limit) {
        return progressService.listRecentActivities(student.getId(), limit).stream()
                .map(LearningActivityDto::from).toList();
    }
}

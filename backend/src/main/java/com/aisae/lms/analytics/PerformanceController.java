package com.aisae.lms.analytics;

import com.aisae.lms.analytics.dto.DashboardStatsDto;
import com.aisae.lms.analytics.dto.TopicPerformanceDto;
import com.aisae.lms.quiz.dto.AttemptResultDto;
import com.aisae.lms.quiz.QuizService;
import com.aisae.lms.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/me")
public class PerformanceController {

    private final PerformanceService performanceService;
    private final QuizService quizService;

    public PerformanceController(PerformanceService performanceService, QuizService quizService) {
        this.performanceService = performanceService;
        this.quizService = quizService;
    }

    @GetMapping("/dashboard")
    public DashboardStatsDto dashboard(@AuthenticationPrincipal User student) {
        return performanceService.computeDashboard(student.getId());
    }

    @GetMapping("/performance/topics")
    public List<TopicPerformanceDto> topicPerformance(@AuthenticationPrincipal User student) {
        return performanceService.computeTopicPerformance(student.getId());
    }

    @GetMapping("/performance/attempts")
    public List<AttemptResultDto> attemptHistory(@AuthenticationPrincipal User student) {
        return quizService.listMyAttempts(student, null);
    }
}

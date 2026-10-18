package com.aisae.lms.recommendation;

import com.aisae.lms.recommendation.dto.QuizRecommendationResponseDto;
import com.aisae.lms.recommendation.dto.RecommendationResponseDto;
import com.aisae.lms.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final QuizRecommendationService quizRecommendationService;

    public RecommendationController(RecommendationService recommendationService,
                                    QuizRecommendationService quizRecommendationService) {
        this.recommendationService = recommendationService;
        this.quizRecommendationService = quizRecommendationService;
    }

    @GetMapping
    public RecommendationResponseDto getRecommendations(@AuthenticationPrincipal User student) {
        return recommendationService.generate(student);
    }

    @GetMapping("/quizzes")
    public QuizRecommendationResponseDto getQuizRecommendations(
            @AuthenticationPrincipal User student,
            @RequestParam(defaultValue = "false") boolean refresh) {
        return quizRecommendationService.getRecommendations(student, refresh);
    }
}

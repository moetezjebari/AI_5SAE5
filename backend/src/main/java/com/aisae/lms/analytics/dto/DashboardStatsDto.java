package com.aisae.lms.analytics.dto;

import com.aisae.lms.progress.dto.CourseProgressDto;
import com.aisae.lms.progress.dto.LearningActivityDto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardStatsDto(
        int totalCoursesEnrolled,
        int coursesCompleted,
        int coursesInProgress,
        BigDecimal overallProgressPercent,
        BigDecimal averageQuizScorePercent,
        int totalQuizAttempts,
        List<CourseProgressDto> courseProgress,
        List<LearningActivityDto> recentActivities,
        List<ScoreTrendPointDto> scoreTrend,
        List<TopicPerformanceDto> topicStrengths,
        List<TopicPerformanceDto> topicWeaknesses
) {
}

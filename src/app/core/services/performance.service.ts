import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  DashboardStats,
  TopicPerformance,
  AttemptResult,
  CourseProgress,
  LearningActivityItem,
  Page,
  ApiCourse,
  ApiQuiz,
} from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class PerformanceService {
  private readonly api = inject(ApiService);

  getDashboard(): Observable<DashboardStats> {
    return this.api.get<DashboardStats>('/me/dashboard');
  }

  getTopicPerformance(): Observable<TopicPerformance[]> {
    return this.api.get<TopicPerformance[]>('/me/performance/topics');
  }

  getAttemptHistory(): Observable<AttemptResult[]> {
    return this.api.get<AttemptResult[]>('/me/performance/attempts');
  }

  getProgress(): Observable<CourseProgress[]> {
    return this.api.get<CourseProgress[]>('/me/progress');
  }

  getActivities(limit = 20): Observable<LearningActivityItem[]> {
    return this.api.get<LearningActivityItem[]>(`/me/activities?limit=${limit}`);
  }
}

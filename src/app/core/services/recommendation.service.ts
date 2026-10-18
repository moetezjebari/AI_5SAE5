import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RecommendationResponse, QuizRecommendationResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class RecommendationApiService {
  private readonly api = inject(ApiService);

  getRecommendations(): Observable<RecommendationResponse> {
    return this.api.get<RecommendationResponse>('/me/recommendations');
  }

  getQuizRecommendations(refresh = false): Observable<QuizRecommendationResponse> {
    const params = refresh ? '?refresh=true' : '';
    return this.api.get<QuizRecommendationResponse>(`/me/recommendations/quizzes${params}`);
  }
}

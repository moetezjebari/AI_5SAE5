import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiQuiz, AttemptResult, AnswerSubmission, Page, QuizUpsertPayload } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class BackendQuizService {
  private readonly api = inject(ApiService);

  search(params?: { courseId?: number; page?: number; size?: number }): Observable<Page<ApiQuiz>> {
    const p = new URLSearchParams();
    if (params?.courseId) p.set('courseId', String(params.courseId));
    p.set('page', String(params?.page ?? 0));
    p.set('size', String(params?.size ?? 50));
    return this.api.get<Page<ApiQuiz>>(`/quizzes?${p}`);
  }

  getById(id: number): Observable<ApiQuiz> {
    return this.api.get<ApiQuiz>(`/quizzes/${id}`);
  }

  getForManagement(id: number): Observable<ApiQuiz> {
    return this.api.get<ApiQuiz>(`/quizzes/${id}/manage`);
  }

  create(payload: QuizUpsertPayload): Observable<ApiQuiz> {
    return this.api.post<ApiQuiz>('/quizzes', payload);
  }

  update(id: number, payload: QuizUpsertPayload): Observable<ApiQuiz> {
    return this.api.put<ApiQuiz>(`/quizzes/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/quizzes/${id}`);
  }

  startAttempt(quizId: number): Observable<AttemptResult> {
    return this.api.post<AttemptResult>(`/quizzes/${quizId}/attempts`, {});
  }

  submitAttempt(attemptId: number, answers: AnswerSubmission[], timeSpentSeconds?: number): Observable<AttemptResult> {
    return this.api.post<AttemptResult>(`/quizzes/attempts/${attemptId}/submit`, {
      answers,
      timeSpentSeconds: timeSpentSeconds ?? null,
    });
  }

  getAttempt(attemptId: number): Observable<AttemptResult> {
    return this.api.get<AttemptResult>(`/quizzes/attempts/${attemptId}`);
  }

  getMyAttempts(quizId?: number): Observable<AttemptResult[]> {
    const suffix = quizId ? `?quizId=${quizId}` : '';
    return this.api.get<AttemptResult[]>(`/quizzes/me/attempts${suffix}`);
  }
}

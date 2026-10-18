import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiCourse, CourseProgress, CourseUpsertPayload, Page } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class BackendCourseService {
  private readonly api = inject(ApiService);

  search(params?: {
    status?: string;
    subject?: string;
    level?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Observable<Page<ApiCourse>> {
    const p = new URLSearchParams();
    if (params?.status) p.set('status', params.status);
    if (params?.subject) p.set('subject', params.subject);
    if (params?.level) p.set('level', params.level);
    if (params?.search) p.set('search', params.search);
    p.set('page', String(params?.page ?? 0));
    p.set('size', String(params?.size ?? 50));
    return this.api.get<Page<ApiCourse>>(`/courses?${p}`);
  }

  getById(id: number): Observable<ApiCourse> {
    return this.api.get<ApiCourse>(`/courses/${id}`);
  }

  create(payload: CourseUpsertPayload): Observable<ApiCourse> {
    return this.api.post<ApiCourse>('/courses', payload);
  }

  update(id: number, payload: CourseUpsertPayload): Observable<ApiCourse> {
    return this.api.put<ApiCourse>(`/courses/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/courses/${id}`);
  }

  completeLesson(courseId: number, lessonId: number): Observable<void> {
    return this.api.post<void>(`/courses/${courseId}/lessons/${lessonId}/complete`, {});
  }
}

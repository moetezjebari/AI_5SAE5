import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiService } from './api.service';
import {
  TeacherRecommendation,
  TeacherRecommendationPayload,
  StudentOption,
  CourseOption,
  Page,
  ApiCourse,
} from '../models/api.model';

const STORAGE_KEY = 'lms_teacher_recs';

const DEFAULT_STUDENTS: StudentOption[] = [
  { id: 1, firstName: 'Étudiant', lastName: 'Démo', email: 'student@lms.local', role: 'STUDENT' },
  { id: 2, firstName: 'Alice', lastName: 'Martin', email: 'alice.martin@lms.local', role: 'STUDENT' },
  { id: 3, firstName: 'Thomas', lastName: 'Bernard', email: 'thomas.bernard@lms.local', role: 'STUDENT' }
];

const DEFAULT_COURSES: CourseOption[] = [
  { id: 1, title: 'Introduction à Angular & TypeScript', subject: 'Frontend', level: 'DEBUTANT' },
  { id: 2, title: 'Spring Boot 3 et Architecture REST', subject: 'Backend', level: 'INTERMEDIAIRE' },
  { id: 3, title: 'Bases de données SQL et Modélisation', subject: 'Data', level: 'DEBUTANT' }
];

@Injectable({ providedIn: 'root' })
export class TeacherRecommendationService {
  private readonly api = inject(ApiService);

  private getStoredList(): TeacherRecommendation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveStoredList(list: TeacherRecommendation[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  list(): Observable<TeacherRecommendation[]> {
    return this.api.get<TeacherRecommendation[]>('/teacher/recommendations').pipe(
      catchError((err) => {
        console.warn('Backend teacher recommendations unavailable (404/offline), using local cache:', err);
        return of(this.getStoredList());
      })
    );
  }

  getById(id: number): Observable<TeacherRecommendation> {
    return this.api.get<TeacherRecommendation>(`/teacher/recommendations/${id}`).pipe(
      catchError(() => {
        const found = this.getStoredList().find(r => r.id === id);
        if (found) return of(found);
        throw new Error('Recommandation introuvable');
      })
    );
  }

  create(payload: TeacherRecommendationPayload): Observable<TeacherRecommendation> {
    return this.api.post<TeacherRecommendation>('/teacher/recommendations', payload).pipe(
      catchError((err) => {
        console.warn('Backend create recommendation unavailable, saving locally:', err);
        const stored = this.getStoredList();
        const newId = stored.length ? Math.max(...stored.map(r => r.id)) + 1 : Date.now();
        const newRec: TeacherRecommendation = {
          id: newId,
          teacherId: 1,
          teacherName: 'Enseignant',
          studentId: payload.studentId || 1,
          studentName: payload.studentEmail || 'Étudiant',
          studentEmail: payload.studentEmail || 'student@lms.local',
          courseId: payload.courseId || 1,
          courseTitle: payload.courseTitle || 'Cours recommandé',
          courseSubject: 'Formation',
          reason: payload.reason,
          priority: payload.priority || 'HIGH',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        stored.unshift(newRec);
        this.saveStoredList(stored);
        return of(newRec);
      })
    );
  }

  update(id: number, payload: TeacherRecommendationPayload): Observable<TeacherRecommendation> {
    return this.api.put<TeacherRecommendation>(`/teacher/recommendations/${id}`, payload).pipe(
      catchError((err) => {
        console.warn('Backend update recommendation unavailable, updating locally:', err);
        const stored = this.getStoredList();
        const index = stored.findIndex(r => r.id === id);
        if (index !== -1) {
          stored[index] = {
            ...stored[index],
            studentId: payload.studentId ?? stored[index].studentId,
            studentEmail: payload.studentEmail ?? stored[index].studentEmail,
            courseId: payload.courseId ?? stored[index].courseId,
            courseTitle: payload.courseTitle ?? stored[index].courseTitle,
            reason: payload.reason,
            priority: payload.priority || stored[index].priority,
            updatedAt: new Date().toISOString()
          };
          this.saveStoredList(stored);
          return of(stored[index]);
        }
        throw err;
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/teacher/recommendations/${id}`).pipe(
      catchError((err) => {
        console.warn('Backend delete recommendation unavailable, deleting locally:', err);
        const filtered = this.getStoredList().filter(r => r.id !== id);
        this.saveStoredList(filtered);
        return of(undefined as void);
      })
    );
  }

  getStudents(): Observable<StudentOption[]> {
    return this.api.get<StudentOption[]>('/teacher/recommendations/students').pipe(
      catchError(() => {
        return of(DEFAULT_STUDENTS);
      })
    );
  }

  getCourses(): Observable<CourseOption[]> {
    return this.api.get<CourseOption[]>('/teacher/recommendations/courses').pipe(
      catchError(() => {
        // Fallback to existing /courses endpoint
        return this.api.get<Page<ApiCourse>>('/courses?size=100').pipe(
          map(page => (page.content || []).map(c => ({
            id: c.id,
            title: c.title,
            subject: c.subject,
            level: c.level
          }))),
          catchError(() => of(DEFAULT_COURSES))
        );
      })
    );
  }
}

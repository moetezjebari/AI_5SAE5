import { Injectable, signal } from '@angular/core';
import { MOCK_QUIZZES } from '../mocks/mock-data';
import { Quiz } from '../models/lms.model';

const STORAGE_KEY = 'lms_custom_quizzes';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly _quizzes = signal<Quiz[]>(this.loadInitialQuizzes());
  readonly quizzes = this._quizzes.asReadonly();

  private loadInitialQuizzes(): Quiz[] {
    const defaultQuizzes = [...MOCK_QUIZZES];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Quiz[] = JSON.parse(stored);
        // Fusionner sans doublons d'ID
        const storedIds = new Set(parsed.map(q => q.id));
        const filteredDefaults = defaultQuizzes.filter(q => !storedIds.has(q.id));
        return [...parsed, ...filteredDefaults];
      }
    } catch (e) {
      console.warn('Impossible de charger les quiz du localStorage:', e);
    }
    return defaultQuizzes;
  }

  private persistCustomQuizzes(allQuizzes: Quiz[]): void {
    try {
      // On sauvegarde les quiz créés ou générés par IA
      const customQuizzes = allQuizzes.filter(q => q.isAiGenerated || q.id.startsWith('custom-') || q.id.startsWith('quiz-ai-'));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customQuizzes));
    } catch (e) {
      console.warn('Impossible de sauvegarder les quiz dans le localStorage:', e);
    }
  }

  getAll(): Quiz[] {
    return this._quizzes();
  }

  getById(id: string): Quiz | undefined {
    return this._quizzes().find(q => q.id === id);
  }

  getByCourseId(courseId: string): Quiz[] {
    return this._quizzes().filter(q => q.courseId === courseId || q.course.toLowerCase().includes(courseId.toLowerCase()));
  }

  saveQuiz(quiz: Quiz): void {
    const current = this._quizzes();
    const existingIndex = current.findIndex(q => q.id === quiz.id);
    let updated: Quiz[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = quiz;
    } else {
      updated = [quiz, ...current];
    }
    this._quizzes.set(updated);
    this.persistCustomQuizzes(updated);
  }

  deleteQuiz(id: string): boolean {
    const current = this._quizzes();
    const updated = current.filter(q => q.id !== id);
    if (updated.length !== current.length) {
      this._quizzes.set(updated);
      this.persistCustomQuizzes(updated);
      return true;
    }
    return false;
  }
}

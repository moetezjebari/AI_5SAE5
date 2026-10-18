import { Injectable, signal } from '@angular/core';
import { MOCK_COURSES } from '../mocks/mock-data';
import { Course } from '../models/lms.model';

const STORAGE_KEY = 'lms_custom_courses';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly _courses = signal<Course[]>(this.loadInitialCourses());
  readonly courses = this._courses.asReadonly();

  private loadInitialCourses(): Course[] {
    const defaultCourses = [...MOCK_COURSES];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Course[] = JSON.parse(stored);
        const storedIds = new Set(parsed.map(c => c.id));
        const filteredDefaults = defaultCourses.filter(c => !storedIds.has(c.id));
        return [...parsed, ...filteredDefaults];
      }
    } catch (e) {
      console.warn('Impossible de charger les cours du localStorage:', e);
    }
    return defaultCourses;
  }

  private persistCourses(allCourses: Course[]): void {
    try {
      const defaultIds = new Set(MOCK_COURSES.map(c => c.id));
      const customCourses = allCourses.filter(c => !defaultIds.has(c.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customCourses));
    } catch (e) {
      console.warn('Impossible de sauvegarder les cours dans le localStorage:', e);
    }
  }

  getAll(): Course[] {
    return this._courses();
  }

  getById(id: string): Course | undefined {
    return this._courses().find(c => c.id === id);
  }

  saveCourse(course: Course): void {
    const current = this._courses();
    const existingIndex = current.findIndex(c => c.id === course.id);
    let updated: Course[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = course;
    } else {
      updated = [course, ...current];
    }
    this._courses.set(updated);
    this.persistCourses(updated);
  }

  deleteCourse(id: string): boolean {
    const current = this._courses();
    const updated = current.filter(c => c.id !== id);
    if (updated.length !== current.length) {
      this._courses.set(updated);
      this.persistCourses(updated);
      return true;
    }
    return false;
  }

  /**
   * Extrait tout le texte pédagogique d'un cours (synthèse, modules, leçons)
   * afin de fournir un contexte riche et complet à l'IA.
   */
  getDetailedCourseContext(courseId: string, specificTopic?: string): string {
    const course = this.getById(courseId);
    if (!course) return '';

    const lines: string[] = [];
    lines.push(`TITRE DU COURS : ${course.title}`);
    lines.push(`DOMAINE / CATÉGORIE : ${course.category}`);
    lines.push(`NIVEAU : ${course.level}`);
    lines.push(`DESCRIPTION : ${course.description}`);

    if (course.topics && course.topics.length > 0) {
      lines.push(`THÈMES PRINCIPAUX : ${course.topics.join(', ')}`);
    }

    if (specificTopic?.trim()) {
      lines.push(`FOCUS DEMANDÉ PAR L'ÉTUDIANT : ${specificTopic.trim()}`);
    }

    if (course.fullContent) {
      lines.push(`\nCONTENU DÉTAILLÉ DU COURS :\n${course.fullContent}`);
    }

    lines.push('\nMODULES ET LEÇONS DU COURS :');
    course.modules.forEach((mod, modIdx) => {
      lines.push(`\nModule ${modIdx + 1} : ${mod.title}`);
      if (mod.summary) lines.push(`Synthèse : ${mod.summary}`);

      mod.lessons.forEach((l, lIdx) => {
        lines.push(`  - Leçon ${lIdx + 1} : ${l.title}`);
        if (l.content) lines.push(`    Contenu : ${l.content}`);
        if (l.keyPoints && l.keyPoints.length > 0) {
          lines.push(`    Points clés : ${l.keyPoints.join(' | ')}`);
        }
      });
    });

    return lines.join('\n');
  }
}

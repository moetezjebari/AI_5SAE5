import { Injectable, signal } from '@angular/core';
import { MOCK_COURSES } from '../mocks/mock-data';
import { Course } from '../models/lms.model';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly _courses = signal<Course[]>(MOCK_COURSES);
  readonly courses = this._courses.asReadonly();

  getAll(): Course[] {
    return this._courses();
  }

  getById(id: string): Course | undefined {
    return this._courses().find(c => c.id === id);
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

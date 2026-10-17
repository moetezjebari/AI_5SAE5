import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { QuizService } from '../../../core/services/quiz.service';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';
import { ProgressBar } from '../../../shared/components/progress-bar';

@Component({
  selector: 'app-course-detail-page',
  imports: [PageHeader, Card, ProgressBar, EmptyState, RouterLink],
  template: `
    @if (course(); as c) {
      <app-page-header
        [title]="c.title"
        [subtitle]="c.teacher + ' · ' + c.level + ' · ' + c.durationHours + ' h · ' + c.category"
      >
        <a class="btn" routerLink="/courses"><span class="material-symbols-outlined">arrow_back</span> Retour</a>
        <a class="btn" routerLink="/courses/summary" [queryParams]="{ course: c.id }">
          <span class="material-symbols-outlined">summarize</span> Résumé IA
        </a>
        <a class="btn btn-primary" routerLink="/quizzes/generate" [queryParams]="{ course: c.id }">
          <span class="material-symbols-outlined">auto_awesome</span> Générer un quiz IA
        </a>
      </app-page-header>

      <div class="layout">
        <div class="main-content">
          <!-- Aperçu du contenu pédagogique du cours -->
          @if (c.fullContent) {
            <app-card title="Contenu pédagogique du cours">
              <div class="course-textbook">
                <p class="description-lead">{{ c.description }}</p>
                @if (c.topics && c.topics.length > 0) {
                  <div class="topics-tags">
                    @for (t of c.topics; track t) {
                      <span class="badge">{{ t }}</span>
                    }
                  </div>
                }
                <div class="text-content">
                  <pre class="full-text">{{ c.fullContent }}</pre>
                </div>
              </div>
            </app-card>
          }

          <!-- Modules et leçons -->
          <div class="modules">
            @for (m of c.modules; track m.title; let i = $index) {
              <app-card [title]="'Module ' + (i + 1) + ' · ' + m.title">
                @if (m.summary) {
                  <p class="module-summary text-muted">{{ m.summary }}</p>
                }
                <ul class="lessons">
                  @for (l of m.lessons; track l.title; let li = $index) {
                    <li class="lesson-row" (click)="toggleLesson(i, li)">
                      <div class="lesson-main">
                        <span class="material-symbols-outlined check-mark" [class.done]="l.done">
                          {{ l.done ? 'check_circle' : 'radio_button_unchecked' }}
                        </span>
                        <span class="lesson-title">{{ l.title }}</span>
                        <span class="text-muted duration">{{ l.duration }}</span>
                        <span class="material-symbols-outlined chevron">
                          {{ isLessonOpen(i, li) ? 'expand_less' : 'expand_more' }}
                        </span>
                      </div>

                      @if (isLessonOpen(i, li)) {
                        <div class="lesson-expanded-content">
                          @if (l.content) {
                            <p class="lesson-desc">{{ l.content }}</p>
                          }
                          @if (l.keyPoints && l.keyPoints.length > 0) {
                            <div class="key-points">
                              <strong>Notions clés à retenir :</strong>
                              <ul>
                                @for (kp of l.keyPoints; track kp) {
                                  <li>{{ kp }}</li>
                                }
                              </ul>
                            </div>
                          }
                        </div>
                      }
                    </li>
                  }
                </ul>
              </app-card>
            }
          </div>
        </div>

        <aside class="sidebar-col">
          <app-card title="Progression">
            <app-progress-bar [value]="c.progress" />
            <p class="text-muted" style="margin: var(--space-3) 0;">{{ c.progress }}% terminé</p>
            <a class="btn btn-primary btn-block" routerLink="/quizzes/generate" [queryParams]="{ course: c.id }">
              <span class="material-symbols-outlined">auto_awesome</span> Tester mes connaissances (Quiz IA)
            </a>
          </app-card>

          <!-- Quiz associés à ce cours -->
          <app-card title="Quiz disponibles">
            @if (relatedQuizzes().length > 0) {
              <div class="related-quizzes">
                @for (q of relatedQuizzes(); track q.id) {
                  <div class="related-quiz-item">
                    <div>
                      <strong>{{ q.title }}</strong>
                      <p class="text-muted meta">
                        {{ q.questions.length }} Q · {{ q.durationMin }} min · {{ q.difficulty }}
                        @if (q.isAiGenerated) {
                          <span class="badge badge-ai">IA</span>
                        }
                      </p>
                    </div>
                    <a class="btn btn-sm" [routerLink]="['/quizzes', q.id]">Passer</a>
                  </div>
                }
              </div>
            } @else {
              <p class="text-muted" style="font-size: 0.9rem;">Aucun quiz disponible pour ce cours pour le moment.</p>
            }
            <a class="btn btn-block" style="margin-top: var(--space-3);" routerLink="/quizzes/generate" [queryParams]="{ course: c.id }">
              <span class="material-symbols-outlined">add</span> Créer un quiz IA
            </a>
          </app-card>
        </aside>
      </div>
    } @else {
      <app-empty-state icon="error" message="Cours introuvable." />
    }
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 1fr 340px; gap: var(--space-4); align-items: start; }
    .main-content { display: grid; gap: var(--space-4); }
    .description-lead { font-size: 1.05rem; margin-bottom: var(--space-3); }
    .topics-tags { display: flex; flex-wrap: wrap; gap: var(--space-1); margin-bottom: var(--space-3); }
    .course-textbook {
      .full-text {
        font-family: inherit; font-size: 0.92rem; line-height: 1.6;
        white-space: pre-wrap; word-break: break-word; color: var(--color-text);
        background: var(--color-bg); padding: var(--space-4); border-radius: var(--radius-md);
        margin: 0;
      }
    }
    .modules { display: grid; gap: var(--space-4); }
    .module-summary { font-size: 0.9rem; margin-bottom: var(--space-3); }
    .lessons { list-style: none; margin: 0; padding: 0; }
    .lesson-row {
      display: flex; flex-direction: column; padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-border); cursor: pointer;
      &:last-child { border-bottom: 0; }
    }
    .lesson-main { display: flex; align-items: center; gap: var(--space-3); }
    .lesson-title { flex: 1; font-weight: 500; font-size: 0.95rem; }
    .duration { font-size: 0.85rem; }
    .check-mark.done { color: var(--color-success); }
    .chevron { color: var(--color-text-muted); font-size: 20px; }
    .lesson-expanded-content {
      padding: var(--space-3) var(--space-4); margin-top: var(--space-2);
      background: var(--color-bg); border-radius: var(--radius-md); font-size: 0.9rem;
      .lesson-desc { margin: 0 0 var(--space-2); line-height: 1.5; }
      .key-points {
        ul { margin: var(--space-1) 0 0; padding-left: var(--space-4); }
        li { margin-bottom: 2px; }
      }
    }
    .sidebar-col { display: grid; gap: var(--space-4); }
    .related-quizzes { display: flex; flex-direction: column; gap: var(--space-3); }
    .related-quiz-item {
      display: flex; justify-content: space-between; align-items: center; gap: var(--space-2);
      padding-bottom: var(--space-2); border-bottom: 1px solid var(--color-border);
      &:last-child { border-bottom: 0; }
      strong { font-size: 0.92rem; }
      .meta { margin: 2px 0 0; font-size: 0.78rem; display: flex; align-items: center; gap: 4px; }
    }
    .badge-ai { background: color-mix(in srgb, var(--color-primary) 15%, transparent); color: var(--color-primary); font-size: 0.72rem; }
    .btn-sm { padding: 4px 10px; font-size: 0.8rem; }
    @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } }
  `]
})
export class CourseDetailPage {
  readonly id = input.required<string>();

  private readonly courseService = inject(CourseService);
  private readonly quizService = inject(QuizService);

  protected readonly course = computed(() => this.courseService.getById(this.id()));

  protected readonly relatedQuizzes = computed(() => {
    const c = this.course();
    if (!c) return [];
    return this.quizService.getByCourseId(c.id);
  });

  protected readonly openLessons = signal<Record<string, boolean>>({});

  protected toggleLesson(moduleIdx: number, lessonIdx: number): void {
    const key = `${moduleIdx}-${lessonIdx}`;
    this.openLessons.update(prev => ({ ...prev, [key]: !prev[key] }));
  }

  protected isLessonOpen(moduleIdx: number, lessonIdx: number): boolean {
    const key = `${moduleIdx}-${lessonIdx}`;
    return !!this.openLessons()[key];
  }
}

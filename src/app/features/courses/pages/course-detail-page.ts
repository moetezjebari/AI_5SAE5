import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackendCourseService } from '../../../core/services/backend-course.service';
import { BackendQuizService } from '../../../core/services/backend-quiz.service';
import { ApiCourse, ApiQuiz, CourseProgress } from '../../../core/models/api.model';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';
import { ProgressBar } from '../../../shared/components/progress-bar';
import { PerformanceService } from '../../../core/services/performance.service';

@Component({
  selector: 'app-course-detail-page',
  imports: [PageHeader, Card, ProgressBar, EmptyState, RouterLink],
  template: `
    @if (loading()) {
      <div class="state-msg"><span class="material-symbols-outlined spin">progress_activity</span> Chargement…</div>
    } @else if (error()) {
      <div class="state-msg error">
        <span class="material-symbols-outlined">error</span> {{ error() }}
      </div>
    } @else if (course(); as c) {
      <app-page-header [title]="c.title"
        [subtitle]="c.createdByName + ' · ' + labelLevel(c.level) + ' · ' + (c.estimatedDurationMinutes / 60).toFixed(0) + ' h · ' + c.subject">
        <a class="btn" routerLink="/courses"><span class="material-symbols-outlined">arrow_back</span> Retour</a>
      </app-page-header>

      <div class="layout">
        <div class="main-content">
          @if (c.description) {
            <app-card title="Description">
              <p class="description">{{ c.description }}</p>
            </app-card>
          }

          @if (c.lessons && c.lessons.length) {
            <div class="modules">
              <app-card title="Leçons du cours">
                <ul class="lessons">
                  @for (lesson of c.lessons; track lesson.id; let i = $index) {
                    <li class="lesson-row">
                      <div class="lesson-main" (click)="toggleLesson(i)">
                        <span class="lesson-num">{{ i + 1 }}</span>
                        <span class="lesson-title">{{ lesson.title }}</span>
                        @if (lesson.topic) {
                          <span class="topic-chip">{{ lesson.topic }}</span>
                        }
                        <span class="text-muted duration">{{ lesson.durationMinutes }} min</span>
                        <span class="material-symbols-outlined chevron">
                          {{ isOpen(i) ? 'expand_less' : 'expand_more' }}
                        </span>
                      </div>
                      @if (isOpen(i) && lesson.content) {
                        <div class="lesson-expanded">
                          <p>{{ lesson.content }}</p>
                          <button class="btn btn-sm" (click)="completeLesson(c.id, lesson.id!)">
                            <span class="material-symbols-outlined">check_circle</span> Marquer comme terminée
                          </button>
                        </div>
                      }
                    </li>
                  }
                </ul>
              </app-card>
            </div>
          }
        </div>

        <aside class="sidebar-col">
          <!-- Progress card -->
          @if (courseProgress(); as prog) {
            <app-card title="Ma progression">
              <app-progress-bar [value]="prog.progressPercent" />
              <p class="text-muted prog-pct">{{ prog.progressPercent.toFixed(0) }}% terminé</p>
              <span class="badge" [class.badge-success]="prog.status === 'COMPLETED'"
                    [class.badge-warning]="prog.status === 'IN_PROGRESS'">{{ labelStatus(prog.status) }}</span>
            </app-card>
          }

          <!-- Quizzes -->
          <app-card title="Quiz associés">
            @if (quizLoading()) {
              <p class="text-muted">Chargement…</p>
            } @else if (quizzes().length) {
              @for (q of quizzes(); track q.id) {
                <div class="quiz-item">
                  <div>
                    <strong>{{ q.title }}</strong>
                    <p class="text-muted meta">{{ q.questionCount }} Q · {{ q.durationMinutes }} min · {{ q.difficulty }}</p>
                  </div>
                  <a class="btn btn-sm btn-primary" [routerLink]="['/quizzes', q.id]">Passer</a>
                </div>
              }
            } @else {
              <p class="text-muted" style="font-size: 0.9rem;">Aucun quiz disponible pour ce cours.</p>
            }
          </app-card>
        </aside>
      </div>
    } @else {
      <app-empty-state icon="error" message="Cours introuvable." />
    }
  `,
  styles: [`
    .state-msg { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-4); color: var(--color-text-muted); }
    .state-msg.error { color: var(--color-danger); }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .layout { display: grid; grid-template-columns: 1fr 320px; gap: var(--space-4); align-items: start; }
    .main-content { display: grid; gap: var(--space-4); }
    .description { font-size: 1rem; line-height: 1.6; margin: 0; }
    .modules { display: grid; gap: var(--space-4); }
    .lessons { list-style: none; margin: 0; padding: 0; }
    .lesson-row { border-bottom: 1px solid var(--color-border); &:last-child { border-bottom: 0; } }
    .lesson-main { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) 0; cursor: pointer;
      &:hover { opacity: 0.8; } }
    .lesson-num { width: 24px; height: 24px; border-radius: 50%; background: var(--color-primary-soft);
      color: var(--color-primary); display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; flex-shrink: 0; }
    .lesson-title { flex: 1; font-weight: 500; font-size: 0.95rem; }
    .topic-chip { font-size: 0.75rem; padding: 2px 7px; background: var(--color-bg); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); }
    .duration { font-size: 0.83rem; white-space: nowrap; }
    .chevron { color: var(--color-text-muted); font-size: 20px; }
    .lesson-expanded { padding: var(--space-3) var(--space-4) var(--space-3) 44px;
      background: var(--color-bg); border-radius: var(--radius-md); margin-bottom: var(--space-2);
      p { margin: 0 0 var(--space-3); font-size: 0.9rem; line-height: 1.6; } }
    .btn-sm { padding: 4px 10px; font-size: 0.8rem; }
    .sidebar-col { display: grid; gap: var(--space-4); }
    .prog-pct { margin: var(--space-2) 0 var(--space-2); font-size: 0.9rem; }
    .quiz-item { display: flex; justify-content: space-between; align-items: center; gap: var(--space-2);
      padding-bottom: var(--space-3); margin-bottom: var(--space-3); border-bottom: 1px solid var(--color-border);
      &:last-child { border-bottom: 0; margin-bottom: 0; padding-bottom: 0; }
      strong { font-size: 0.9rem; display: block; margin-bottom: 2px; }
      .meta { font-size: 0.78rem; margin: 0; } }
    @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } }
  `]
})
export class CourseDetailPage implements OnInit {
  readonly id = input.required<string>();

  private readonly courseService = inject(BackendCourseService);
  private readonly quizService = inject(BackendQuizService);
  private readonly perfService = inject(PerformanceService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly course = signal<ApiCourse | null>(null);
  protected readonly quizzes = signal<ApiQuiz[]>([]);
  protected readonly quizLoading = signal(true);
  protected readonly openLessons = signal<Record<number, boolean>>({});
  protected readonly progressList = signal<CourseProgress[]>([]);

  protected readonly courseProgress = computed(() => {
    const c = this.course();
    if (!c) return null;
    return this.progressList().find((p: CourseProgress) => p.courseId === c.id) ?? null;
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    const numericId = Number(this.id());

    this.courseService.getById(numericId).subscribe({
      next: (course: ApiCourse) => {
        this.course.set(course);
        this.loading.set(false);
        // Load quizzes for this course
        this.quizService.search({ courseId: course.id }).subscribe({
          next: (page: import('../../../core/models/api.model').Page<ApiQuiz>) => { this.quizzes.set(page.content); this.quizLoading.set(false); },
          error: () => this.quizLoading.set(false),
        });
      },
      error: (err: unknown) => {
        this.error.set('Cours introuvable ou backend inaccessible.');
        this.loading.set(false);
        console.error(err);
      },
    });

    this.perfService.getProgress().subscribe({
      next: (list: CourseProgress[]) => this.progressList.set(list),
      error: () => {},
    });
  }

  protected completeLesson(courseId: number, lessonId: number): void {
    this.courseService.completeLesson(courseId, lessonId).subscribe({
      next: () => {
        // Refresh progress
        this.perfService.getProgress().subscribe({ next: list => this.progressList.set(list) });
      },
    });
  }

  protected toggleLesson(i: number): void {
    this.openLessons.update(prev => ({ ...prev, [i]: !prev[i] }));
  }

  protected isOpen(i: number): boolean {
    return !!this.openLessons()[i];
  }

  protected labelLevel(level: string): string {
    if (level === 'DEBUTANT') return 'Débutant';
    if (level === 'INTERMEDIAIRE') return 'Intermédiaire';
    return 'Avancé';
  }

  protected labelStatus(s: string): string {
    if (s === 'COMPLETED') return 'Terminé';
    if (s === 'IN_PROGRESS') return 'En cours';
    return 'Non commencé';
  }
}

import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-quiz-take-page',
  imports: [PageHeader, Card, EmptyState, RouterLink],
  template: `
    @if (quiz(); as q) {
      <app-page-header
        [title]="q.title"
        [subtitle]="q.course + ' · ' + q.durationMin + ' min · ' + q.difficulty"
      >
        <a class="btn" routerLink="/quizzes"><span class="material-symbols-outlined">arrow_back</span> Retour</a>
        @if (q.isAiGenerated) {
          <span class="badge badge-ai"><span class="material-symbols-outlined">auto_awesome</span> Quiz IA</span>
        }
      </app-page-header>

      @if (submitted()) {
        <app-card class="score-card">
          <div class="score-header">
            <div class="score-circle" [class.score-high]="percentage() >= 70" [class.score-low]="percentage() < 50">
              {{ percentage() }}%
            </div>
            <div>
              <h2>Résultat : {{ score() }} / {{ q.questions.length }} bonnes réponses</h2>
              <p class="text-muted">{{ feedbackMessage() }}</p>
            </div>
          </div>
          <div class="score-actions">
            <button class="btn btn-primary" (click)="reset()">
              <span class="material-symbols-outlined">refresh</span> Recommencer le quiz
            </button>
            <a class="btn" routerLink="/quizzes/generate" [queryParams]="{ course: q.courseId || '' }">
              <span class="material-symbols-outlined">auto_awesome</span> Générer un autre quiz
            </a>
            <a class="btn" routerLink="/quizzes">Tous les quiz</a>
          </div>
        </app-card>
      }

      <div class="questions">
        @for (question of q.questions; track question.text; let qi = $index) {
          <app-card [title]="(qi + 1) + '. ' + question.text">
            @for (opt of question.options; track opt; let oi = $index) {
              <label
                class="option"
                [class.correct]="submitted() && oi === question.correct"
                [class.wrong]="submitted() && answers()[qi] === oi && oi !== question.correct"
              >
                <input
                  type="radio"
                  [name]="'q' + qi"
                  [checked]="answers()[qi] === oi"
                  [disabled]="submitted()"
                  (change)="select(qi, oi)"
                />
                <span class="opt-text">{{ opt }}</span>
                @if (submitted() && oi === question.correct) {
                  <span class="material-symbols-outlined indicator-icon ok">check_circle</span>
                } @else if (submitted() && answers()[qi] === oi && oi !== question.correct) {
                  <span class="material-symbols-outlined indicator-icon ko">cancel</span>
                }
              </label>
            }
            @if (submitted()) {
              <div class="explain">
                <span class="material-symbols-outlined">info</span>
                <div>
                  <strong>Explication didactique :</strong>
                  <p>{{ question.explanation }}</p>
                </div>
              </div>
            }
          </app-card>
        }
      </div>

      @if (!submitted()) {
        <div class="submit-bar">
          <button
            class="btn btn-primary submit-btn"
            [disabled]="answeredCount() === 0"
            (click)="submitted.set(true)"
          >
            <span class="material-symbols-outlined">done_all</span>
            Valider mes réponses ({{ answeredCount() }}/{{ q.questions.length }})
          </button>
        </div>
      }
    } @else {
      <app-empty-state icon="error" message="Quiz introuvable.">
        <a class="btn btn-primary" routerLink="/quizzes" style="margin-top: var(--space-3);">
          Retour à la liste des quiz
        </a>
      </app-empty-state>
    }
  `,
  styles: [`
    .questions { display: grid; gap: var(--space-4); max-width: 820px; }
    .badge-ai {
      background: color-mix(in srgb, var(--color-primary) 15%, transparent);
      color: var(--color-primary); display: inline-flex; align-items: center; gap: 4px; font-weight: 600;
      .material-symbols-outlined { font-size: 16px; }
    }
    .score-card { display: block; margin-bottom: var(--space-4); max-width: 820px; }
    .score-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-3); }
    .score-circle {
      width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 1.3rem; font-weight: 800; background: var(--color-warning); color: #fff;
      &.score-high { background: var(--color-success); }
      &.score-low { background: var(--color-danger); }
    }
    .score-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-3); }
    .option {
      display: flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-3);
      margin-bottom: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-md);
      cursor: pointer; transition: background 0.15s ease;
      &:hover { background: color-mix(in srgb, var(--color-bg) 70%, var(--color-surface)); }
      .opt-text { flex: 1; font-size: 0.95rem; }
      .indicator-icon { font-size: 20px; &.ok { color: var(--color-success); } &.ko { color: var(--color-danger); } }
    }
    .option.correct {
      border-color: var(--color-success);
      background: color-mix(in srgb, var(--color-success) 12%, transparent);
      font-weight: 600;
    }
    .option.wrong {
      border-color: var(--color-danger);
      background: color-mix(in srgb, var(--color-danger) 12%, transparent);
    }
    .explain {
      display: flex; gap: var(--space-2); margin: var(--space-3) 0 0;
      padding: var(--space-3); border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--color-primary-soft) 70%, transparent);
      font-size: 0.88rem;
      .material-symbols-outlined { color: var(--color-primary); font-size: 20px; }
      p { margin: var(--space-1) 0 0; }
    }
    .submit-bar { margin-top: var(--space-4); max-width: 820px; }
    .submit-btn { padding: 12px 24px; font-size: 1rem; }
  `]
})
export class QuizTakePage {
  readonly id = input.required<string>();

  private readonly quizService = inject(QuizService);

  protected readonly quiz = computed(() => this.quizService.getById(this.id()));
  protected readonly answers = signal<Record<number, number>>({});
  protected readonly submitted = signal(false);

  protected readonly score = computed(() =>
    (this.quiz()?.questions ?? []).filter((q, i) => this.answers()[i] === q.correct).length
  );

  protected readonly percentage = computed(() => {
    const total = this.quiz()?.questions.length || 0;
    if (total === 0) return 0;
    return Math.round((this.score() / total) * 100);
  });

  protected readonly answeredCount = computed(() => Object.keys(this.answers()).length);

  protected readonly feedbackMessage = computed(() => {
    const p = this.percentage();
    if (p >= 85) return '🎉 Félicitations ! Vous maîtrisez parfaitement les notions de ce cours.';
    if (p >= 60) return '👍 Bon travail ! Quelques notions méritent d\'être révisées en consultant les explications ci-dessous.';
    return '📚 Des révisions sont nécessaires. Prenez le temps de lire attentivement chaque explication didactique.';
  });

  protected select(question: number, option: number): void {
    this.answers.update(a => ({ ...a, [question]: option }));
  }

  protected reset(): void {
    this.answers.set({});
    this.submitted.set(false);
  }
}

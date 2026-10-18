import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackendQuizService } from '../../../core/services/backend-quiz.service';
import { ApiQuiz, ApiQuizQuestion, AttemptResult, AnswerSubmission } from '../../../core/models/api.model';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-quiz-take-page',
  imports: [PageHeader, Card, EmptyState, RouterLink],
  template: `
    @if (pageLoading()) {
      <div class="state-msg"><span class="material-symbols-outlined spin">progress_activity</span> Chargement du quiz…</div>
    } @else if (pageError()) {
      <div class="state-msg error">
        <span class="material-symbols-outlined">error</span> {{ pageError() }}
        <a class="btn" routerLink="/quizzes">Retour</a>
      </div>
    } @else if (quiz(); as q) {
      <app-page-header [title]="q.title"
        [subtitle]="q.courseTitle + ' · ' + q.durationMinutes + ' min · ' + labelDifficulty(q.difficulty)">
        <a class="btn" routerLink="/quizzes"><span class="material-symbols-outlined">arrow_back</span> Retour</a>
      </app-page-header>

      <!-- Result card (after submission) -->
      @if (result(); as r) {
        <app-card class="score-card">
          <div class="score-header">
            <div class="score-circle" [class.score-high]="r.scorePercent >= 70" [class.score-low]="r.scorePercent < 50">
              {{ r.scorePercent.toFixed(0) }}%
            </div>
            <div>
              <h2>{{ r.correctCount }}/{{ r.questionCount }} bonnes réponses</h2>
              <p class="text-muted">{{ r.passed ? '🎉 Quiz réussi !' : '📚 Score insuffisant.' }} Score requis : {{ q.passingScore.toFixed(0) }}%</p>
            </div>
          </div>
          <div class="score-actions">
            <button class="btn btn-primary" (click)="restartQuiz(q.id)">
              <span class="material-symbols-outlined">refresh</span> Recommencer
            </button>
            <a class="btn" routerLink="/performance">Voir mes résultats</a>
            <a class="btn" routerLink="/recommendations">Recommandations IA</a>
            <a class="btn" routerLink="/quizzes">Tous les quiz</a>
          </div>
        </app-card>
      }

      <!-- Questions -->
      @if (q.questions && q.questions.length) {
        <div class="questions">
          @for (question of q.questions; track question.id; let qi = $index) {
            <app-card [title]="(qi + 1) + '. ' + question.questionText">
              @for (opt of question.options; track opt.id) {
                <label class="option"
                       [class.correct]="shouldMarkCorrect(qi, opt.id)"
                       [class.wrong]="shouldMarkWrong(qi, opt.id)">
                  <input type="radio" [name]="'q' + qi"
                         [checked]="opt.id !== undefined && selectedIds(qi).includes(opt.id)"
                         [disabled]="!!result() || submitting()"
                         (change)="select(qi, question.id!, opt.id!)" />
                  <span class="opt-text">{{ opt.optionText }}</span>
                  @if (result() && opt.id !== undefined && isCorrectOption(qi, opt.id!)) {
                    <span class="material-symbols-outlined indicator-icon ok">check_circle</span>
                  } @else if (result() && opt.id !== undefined && isWrongSelected(qi, opt.id!)) {
                    <span class="material-symbols-outlined indicator-icon ko">cancel</span>
                  }
                </label>
              }
              @if (result() && result()!.answers[qi]) {
                <div class="explain">
                  <span class="material-symbols-outlined">info</span>
                  <span>{{ getAnswer(qi)?.correct ? 'Bonne réponse !' : 'Réponse incorrecte.' }}
                    @if (question.topic) { <em>Thème : {{ question.topic }}</em> }
                  </span>
                </div>
              }
            </app-card>
          }
        </div>

        @if (!result()) {
          <div class="submit-bar">
            @if (submitError()) {
              <p class="submit-error"><span class="material-symbols-outlined">error</span> {{ submitError() }}</p>
            }
            <button class="btn btn-primary submit-btn"
                    [disabled]="answeredCount() === 0 || submitting()"
                    (click)="submitQuiz()">
              <span class="material-symbols-outlined" [class.spin]="submitting()">
                {{ submitting() ? 'progress_activity' : 'done_all' }}
              </span>
              {{ submitting() ? 'Envoi…' : 'Valider (' + answeredCount() + '/' + q.questions!.length + ')' }}
            </button>
          </div>
        }
      } @else {
        <p class="text-muted" style="padding: var(--space-4);">Ce quiz n'a pas encore de questions.</p>
      }
    } @else {
      <app-empty-state icon="error" message="Quiz introuvable.">
        <a class="btn btn-primary" routerLink="/quizzes" style="margin-top: var(--space-3);">Retour</a>
      </app-empty-state>
    }
  `,
  styles: [`
    .state-msg { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-4); color: var(--color-text-muted); }
    .state-msg.error { color: var(--color-danger); }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .questions { display: grid; gap: var(--space-4); max-width: 820px; }
    .score-card { display: block; margin-bottom: var(--space-4); max-width: 820px; }
    .score-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-3); }
    .score-circle { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 1.3rem; font-weight: 800; background: var(--color-warning); color: #fff;
      &.score-high { background: var(--color-success); } &.score-low { background: var(--color-danger); } }
    .score-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-3); }
    .option { display: flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-3);
      margin-bottom: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-md);
      cursor: pointer; transition: background 0.15s ease;
      &:hover { background: color-mix(in srgb, var(--color-bg) 70%, var(--color-surface)); }
      .opt-text { flex: 1; font-size: 0.95rem; }
      .indicator-icon { font-size: 20px; &.ok { color: var(--color-success); } &.ko { color: var(--color-danger); } }
    }
    .option.correct { border-color: var(--color-success); background: color-mix(in srgb, var(--color-success) 12%, transparent); font-weight: 600; }
    .option.wrong { border-color: var(--color-danger); background: color-mix(in srgb, var(--color-danger) 12%, transparent); }
    .explain { display: flex; gap: var(--space-2); margin: var(--space-3) 0 0; padding: var(--space-3);
      border-radius: var(--radius-md); background: color-mix(in srgb, var(--color-primary-soft) 70%, transparent);
      font-size: 0.88rem; .material-symbols-outlined { color: var(--color-primary); font-size: 20px; } em { margin-left: 6px; } }
    .submit-bar { margin-top: var(--space-4); max-width: 820px; }
    .submit-error { display: flex; align-items: center; gap: var(--space-2); color: var(--color-danger); font-size: 0.9rem; margin-bottom: var(--space-2); }
    .submit-btn { padding: 12px 24px; font-size: 1rem; }
  `]
})
export class QuizTakePage implements OnInit {
  readonly id = input.required<string>();

  private readonly quizService = inject(BackendQuizService);

  protected readonly pageLoading = signal(true);
  protected readonly pageError = signal<string | null>(null);
  protected readonly quiz = signal<ApiQuiz | null>(null);
  protected readonly attemptId = signal<number | null>(null);

  /** Map: questionIndex -> list of selected optionIds */
  protected readonly answers = signal<Record<number, number[]>>({});
  protected readonly result = signal<AttemptResult | null>(null);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  private startTime = Date.now();

  protected readonly answeredCount = computed(() => Object.keys(this.answers()).length);

  ngOnInit(): void {
    this.startQuiz();
  }

  protected startQuiz(): void {
    this.pageLoading.set(true);
    this.pageError.set(null);
    this.answers.set({});
    this.result.set(null);
    this.submitError.set(null);
    const numericId = Number(this.id());

    this.quizService.getById(numericId).subscribe({
      next: quiz => {
        this.quiz.set(quiz);
        // Start attempt
        this.quizService.startAttempt(numericId).subscribe({
          next: attempt => {
            this.attemptId.set(attempt.attemptId);
            this.startTime = Date.now();
            this.pageLoading.set(false);
          },
          error: err => {
            this.pageError.set('Impossible de démarrer la tentative. Réessayez.');
            this.pageLoading.set(false);
            console.error(err);
          },
        });
      },
      error: err => {
        this.pageError.set('Quiz introuvable.');
        this.pageLoading.set(false);
        console.error(err);
      },
    });
  }

  protected restartQuiz(quizId: number): void {
    this.answers.set({});
    this.result.set(null);
    this.submitError.set(null);
    this.pageLoading.set(true);
    this.quizService.startAttempt(quizId).subscribe({
      next: attempt => {
        this.attemptId.set(attempt.attemptId);
        this.startTime = Date.now();
        this.pageLoading.set(false);
      },
      error: () => this.pageLoading.set(false),
    });
  }

  protected select(questionIdx: number, questionId: number, optionId: number): void {
    // Single-choice: replace selection
    this.answers.update(prev => ({ ...prev, [questionIdx]: [optionId] }));
  }

  protected selectedIds(questionIdx: number): number[] {
    return this.answers()[questionIdx] ?? [];
  }

  protected submitQuiz(): void {
    const aId = this.attemptId();
    const q = this.quiz();
    if (!aId || !q?.questions) return;

    const submissions: AnswerSubmission[] = q.questions.map((question, idx) => ({
      questionId: question.id!,
      selectedOptionIds: this.answers()[idx] ?? [],
    }));

    const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
    this.submitting.set(true);
    this.submitError.set(null);

    this.quizService.submitAttempt(aId, submissions, timeSpent).subscribe({
      next: result => {
        this.result.set(result);
        this.submitting.set(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: err => {
        this.submitError.set('Erreur lors de la soumission. Veuillez réessayer.');
        this.submitting.set(false);
        console.error(err);
      },
    });
  }

  protected labelDifficulty(d: string): string {
    if (d === 'FACILE') return 'Facile';
    if (d === 'MOYEN') return 'Moyen';
    return 'Difficile';
  }

  /** Safe answer lookup — answers array may be sparse */
  protected getAnswer(qi: number): import('../../../core/models/api.model').AttemptAnswerResult | undefined {
    return this.result()?.answers?.[qi];
  }

  protected isCorrectOption(qi: number, optId: number): boolean {
    return this.getAnswer(qi)?.correctOptionIds?.includes(optId) ?? false;
  }

  protected isWrongSelected(qi: number, optId: number): boolean {
    return this.selectedIds(qi).includes(optId) && !this.isCorrectOption(qi, optId);
  }

  protected shouldMarkCorrect(qi: number, optId: number | undefined): boolean {
    if (!this.result() || optId === undefined) return false;
    return this.isCorrectOption(qi, optId);
  }

  protected shouldMarkWrong(qi: number, optId: number | undefined): boolean {
    if (!this.result() || optId === undefined) return false;
    return this.isWrongSelected(qi, optId);
  }
}

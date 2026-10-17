import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-quizzes-page',
  imports: [PageHeader, Card, EmptyState, RouterLink],
  template: `
    <app-page-header title="Quiz et Évaluations" subtitle="Testez vos connaissances et entraînez-vous avec des quiz générés sur mesure.">
      <a class="btn btn-primary" routerLink="/quizzes/generate">
        <span class="material-symbols-outlined">auto_awesome</span> Générer un quiz IA
      </a>
    </app-page-header>

    <div class="filters">
      <input
        class="search"
        type="search"
        placeholder="Rechercher un quiz ou un cours…"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
      />
      <div class="filter-buttons">
        <button class="btn chip" [class.btn-primary]="filter() === 'all'" (click)="filter.set('all')">Tous</button>
        <button class="btn chip" [class.btn-primary]="filter() === 'ai'" (click)="filter.set('ai')">
          <span class="material-symbols-outlined" style="font-size: 15px;">auto_awesome</span> Quiz IA
        </button>
        <button class="btn chip" [class.btn-primary]="filter() === 'standard'" (click)="filter.set('standard')">Standards</button>
      </div>
    </div>

    @if (filteredQuizzes().length > 0) {
      <div class="grid">
        @for (q of filteredQuizzes(); track q.id) {
          <app-card>
            <div class="card-header-bar">
              <span class="badge">{{ q.course }}</span>
              @if (q.isAiGenerated) {
                <span class="badge badge-ai" title="Quiz conçu par l'Intelligence Artificielle">
                  <span class="material-symbols-outlined">auto_awesome</span> IA
                </span>
              }
            </div>

            <h3 class="title">{{ q.title }}</h3>

            <p class="text-muted meta">
              <span class="material-symbols-outlined">help</span> {{ q.questions.length }} questions
              · <span class="material-symbols-outlined">timer</span> {{ q.durationMin }} min
              · <span class="difficulty-tag" [class.diff-hard]="q.difficulty === 'Difficile'" [class.diff-med]="q.difficulty === 'Moyen'">
                {{ q.difficulty }}
              </span>
            </p>

            <div class="card-footer">
              <a class="btn btn-primary btn-block" [routerLink]="['/quizzes', q.id]">
                <span class="material-symbols-outlined">play_arrow</span> Démarrer
              </a>
              @if (q.isAiGenerated || q.id.startsWith('custom-')) {
                <button
                  type="button"
                  class="btn btn-icon delete-btn"
                  title="Supprimer ce quiz"
                  (click)="deleteQuiz(q.id, $event)"
                >
                  <span class="material-symbols-outlined">delete</span>
                </button>
              }
            </div>
          </app-card>
        }
      </div>
    } @else {
      <app-empty-state
        icon="quiz"
        message="Aucun quiz ne correspond à vos critères de recherche."
      >
        <a class="btn btn-primary" routerLink="/quizzes/generate" style="margin-top: var(--space-3);">
          <span class="material-symbols-outlined">auto_awesome</span> Générer un nouveau quiz IA
        </a>
      </app-empty-state>
    }
  `,
  styles: [`
    .filters { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-5); align-items: center; }
    .search { flex: 1 1 240px; padding: 9px 12px; font: inherit; color: var(--color-text); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .filter-buttons { display: flex; gap: var(--space-2); }
    .chip { padding: 6px 14px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 4px; }
    .grid { grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); }
    .card-header-bar { display: flex; justify-content: space-between; align-items: center; gap: var(--space-2); }
    .badge-ai {
      background: color-mix(in srgb, var(--color-primary) 15%, transparent);
      color: var(--color-primary);
      display: inline-flex; align-items: center; gap: 3px; font-weight: 600;
      .material-symbols-outlined { font-size: 14px; }
    }
    .title { margin: var(--space-3) 0 var(--space-2); font-size: 1.1rem; line-height: 1.3; }
    .meta { font-size: 0.85rem; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
    .meta .material-symbols-outlined { font-size: 16px; }
    .difficulty-tag { font-weight: 500; }
    .diff-med { color: var(--color-warning); }
    .diff-hard { color: var(--color-danger); }
    .card-footer { display: flex; gap: var(--space-2); margin-top: var(--space-3); align-items: center; }
    .delete-btn { color: var(--color-text-muted); &:hover { color: var(--color-danger); border-color: var(--color-danger); } }
  `]
})
export class QuizzesPage {
  private readonly quizService = inject(QuizService);

  protected readonly quizzes = this.quizService.quizzes;
  protected readonly query = signal('');
  protected readonly filter = signal<'all' | 'ai' | 'standard'>('all');

  protected readonly filteredQuizzes = computed(() => {
    const q = this.query().toLowerCase().trim();
    const mode = this.filter();

    return this.quizzes().filter(quiz => {
      const matchesSearch = !q || quiz.title.toLowerCase().includes(q) || quiz.course.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (mode === 'ai') return !!quiz.isAiGenerated;
      if (mode === 'standard') return !quiz.isAiGenerated;
      return true;
    });
  });

  protected deleteQuiz(id: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (confirm('Voulez-vous vraiment supprimer ce quiz ?')) {
      this.quizService.deleteQuiz(id);
    }
  }
}

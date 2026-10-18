import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackendQuizService } from '../../../core/services/backend-quiz.service';
import { ApiQuiz } from '../../../core/models/api.model';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-quizzes-page',
  standalone: true,
  imports: [PageHeader, Card, EmptyState, RouterLink],
  template: `
    <app-page-header title="Quiz et Évaluations" subtitle="Testez vos connaissances sur les cours publiés.">
      <div class="header-actions">
        <a class="btn btn-primary" routerLink="/quizzes/generate">
          <span class="material-symbols-outlined">auto_awesome</span> Générer un quiz IA
        </a>
        <a class="btn btn-secondary" routerLink="/quizzes/create">
          <span class="material-symbols-outlined">add</span> Créer un quiz
        </a>
      </div>
    </app-page-header>

    <div class="filters">
      <input class="search" type="search" placeholder="Rechercher un quiz ou un cours…"
             [value]="query()" (input)="query.set($any($event.target).value)" />
      <div class="filter-buttons">
        @for (d of difficulties; track d.value) {
          <button class="btn chip" [class.btn-primary]="diffFilter() === d.value"
                  (click)="diffFilter.set(d.value)">{{ d.label }}</button>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="state-msg"><span class="material-symbols-outlined spin">progress_activity</span> Chargement…</div>
    } @else if (error()) {
      <div class="state-msg error">
        <span class="material-symbols-outlined">error</span> {{ error() }}
        <button class="btn" (click)="load()">Réessayer</button>
      </div>
    } @else if (filtered().length) {
      <div class="grid">
        @for (q of filtered(); track q.id) {
          <app-card>
            <div class="card-header-bar">
              <span class="badge">{{ q.courseTitle }}</span>
              <span class="difficulty-tag" [class.diff-hard]="q.difficulty === 'DIFFICILE'"
                    [class.diff-med]="q.difficulty === 'MOYEN'" [class.diff-easy]="q.difficulty === 'FACILE'">
                {{ labelDifficulty(q.difficulty) }}
              </span>
            </div>
            <h3 class="title">{{ q.title }}</h3>
            @if (q.description) {
              <p class="text-muted desc">{{ q.description }}</p>
            }
            <p class="text-muted meta">
              <span class="material-symbols-outlined">help</span> {{ q.questionCount }} questions
              · <span class="material-symbols-outlined">timer</span> {{ q.durationMinutes }} min
              · <span class="material-symbols-outlined">star</span> Score requis : {{ q.passingScore.toFixed(0) }}%
            </p>
            <div class="card-footer">
              <a class="btn btn-primary btn-sm" [routerLink]="['/quizzes', q.id]">
                <span class="material-symbols-outlined">play_arrow</span> Démarrer
              </a>
              <a class="btn btn-outline btn-sm" [routerLink]="['/quizzes', q.id, 'edit']">
                <span class="material-symbols-outlined">edit</span> Modifier
              </a>
              <button
                type="button"
                class="btn btn-icon delete-btn"
                title="Supprimer ce quiz"
                (click)="deleteQuiz(q.id, $event)"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </app-card>
        }
      </div>
    } @else {
      <app-empty-state icon="quiz" message="Aucun quiz ne correspond à vos critères de recherche.">
        <div class="empty-actions">
          <a class="btn btn-primary" routerLink="/quizzes/generate">
            <span class="material-symbols-outlined">auto_awesome</span> Générer un nouveau quiz IA
          </a>
          <a class="btn btn-secondary" routerLink="/quizzes/create">
            <span class="material-symbols-outlined">add</span> Créer un quiz manuellement
          </a>
        </div>
      </app-empty-state>
    }
  `,
  styles: [`
    .header-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .filters { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-5); align-items: center; }
    .search { flex: 1 1 240px; padding: 9px 12px; font: inherit; color: var(--color-text); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .filter-buttons { display: flex; gap: var(--space-2); }
    .chip { padding: 6px 14px; font-size: 0.85rem; }
    .state-msg { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-4); color: var(--color-text-muted); }
    .state-msg.error { color: var(--color-danger); }
    .state-msg .btn { margin-left: var(--space-2); }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: var(--space-4); }
    .card-header-bar { display: flex; justify-content: space-between; align-items: center; gap: var(--space-2); }
    .difficulty-tag { font-weight: 600; font-size: 0.82rem; padding: 3px 8px; border-radius: var(--radius-sm); }
    .diff-easy { background: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success); }
    .diff-med { background: color-mix(in srgb, var(--color-warning) 20%, transparent); color: var(--color-warning); }
    .diff-hard { background: color-mix(in srgb, var(--color-danger) 15%, transparent); color: var(--color-danger); }
    .title { margin: var(--space-3) 0 var(--space-2); font-size: 1.05rem; line-height: 1.3; }
    .desc { font-size: 0.85rem; margin-bottom: var(--space-2); line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
    .meta { font-size: 0.83rem; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin: 0; }
    .meta .material-symbols-outlined { font-size: 15px; }
    .card-footer { display: flex; gap: var(--space-2); margin-top: var(--space-3); align-items: center; }
    .btn-sm { padding: 5px 12px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 4px; }
    .btn-outline { background: transparent; border: 1px solid var(--color-border); color: var(--color-text); border-radius: var(--radius-md); cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
    .btn-outline:hover { background: var(--color-bg); border-color: var(--color-primary); }
    .delete-btn { margin-left: auto; color: var(--color-text-muted); background: transparent; border: none; cursor: pointer; padding: 4px; display: inline-flex; align-items: center; border-radius: var(--radius-sm); }
    .delete-btn:hover { color: var(--color-danger); background: color-mix(in srgb, var(--color-danger) 12%, transparent); }
    .empty-actions { display: flex; gap: var(--space-3); margin-top: var(--space-3); flex-wrap: wrap; justify-content: center; }
    .btn-secondary { background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); border-radius: var(--radius-md); cursor: pointer; }
    .btn-secondary:hover { background: var(--color-bg); }
  `]
})
export class QuizzesPage implements OnInit {
  private readonly quizService = inject(BackendQuizService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly quizzes = signal<ApiQuiz[]>([]);
  protected readonly query = signal('');
  protected readonly diffFilter = signal<string>('ALL');

  protected readonly difficulties = [
    { label: 'Tous', value: 'ALL' },
    { label: 'Facile', value: 'FACILE' },
    { label: 'Moyen', value: 'MOYEN' },
    { label: 'Difficile', value: 'DIFFICILE' },
  ];

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    const d = this.diffFilter();
    return this.quizzes().filter(quiz =>
      (d === 'ALL' || quiz.difficulty === d) &&
      (!q || quiz.title.toLowerCase().includes(q) || quiz.courseTitle.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.quizService.search({ size: 100 }).subscribe({
      next: page => { this.quizzes.set(page.content); this.loading.set(false); },
      error: err => {
        this.error.set('Impossible de charger les quiz. Vérifiez que le backend est démarré.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  protected deleteQuiz(id: number, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (confirm('Voulez-vous vraiment supprimer ce quiz ?')) {
      this.quizService.delete(id).subscribe({
        next: () => this.load(),
        error: (err) => {
          alert('Impossible de supprimer ce quiz. Assurez-vous d\'être connecté avec un compte enseignant ou administrateur.');
          console.error(err);
        }
      });
    }
  }

  protected labelDifficulty(d: string): string {
    if (d === 'FACILE') return 'Facile';
    if (d === 'MOYEN') return 'Moyen';
    return 'Difficile';
  }
}

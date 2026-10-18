import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PerformanceService } from '../../../core/services/performance.service';
import { AttemptResult, TopicPerformance, CourseProgress } from '../../../core/models/api.model';
import { BarChart, BarDatum } from '../../../shared/components/bar-chart';
import { Card } from '../../../shared/components/card';
import { PageHeader } from '../../../shared/components/page-header';
import { ProgressBar } from '../../../shared/components/progress-bar';
import { StatCard } from '../../../shared/components/stat-card';
import { EmptyState } from '../../../shared/components/empty-state';

@Component({
  selector: 'app-performance-page',
  imports: [PageHeader, Card, StatCard, BarChart, ProgressBar, EmptyState, RouterLink],
  template: `
    <app-page-header title="Performance" subtitle="Analyse de vos résultats réels depuis le serveur." />

    @if (loading()) {
      <div class="state-msg"><span class="material-symbols-outlined spin">progress_activity</span> Chargement…</div>
    } @else if (error()) {
      <div class="state-msg error">
        <span class="material-symbols-outlined">error</span> {{ error() }}
        <button class="btn" (click)="load()">Réessayer</button>
      </div>
    } @else {
      <!-- Stats row -->
      <div class="grid">
        <app-stat-card label="Moyenne générale" [value]="avgScore() + '%'" icon="grade"
          [hint]="attempts().length + ' tentative(s) au total'" />
        <app-stat-card label="Quiz réussis" [value]="passedCount() + '/' + attempts().length" icon="task_alt" />
        <app-stat-card label="Thèmes forts" [value]="strengths().length.toString()" icon="trending_up" />
        <app-stat-card label="Thèmes à réviser" [value]="weaknesses().length.toString()" icon="trending_down" />
      </div>

      <div class="grid two">
        <!-- Score trend -->
        <app-card title="Évolution des scores">
          @if (trendBars().length) {
            <app-bar-chart [data]="trendBars()" />
          } @else {
            <app-empty-state icon="quiz" message="Passez un quiz pour voir votre évolution." />
          }
        </app-card>

        <!-- Course progress -->
        <app-card title="Progression par cours">
          @if (progress().length) {
            @for (c of progress().slice(0, 6); track c.courseId) {
              <div class="prog-row">
                <div class="prog-head">
                  <span>{{ c.courseTitle }}</span>
                  <span class="badge" [class.badge-success]="c.status === 'COMPLETED'"
                        [class.badge-warning]="c.status === 'IN_PROGRESS'">{{ labelStatus(c.status) }}</span>
                </div>
                <app-progress-bar [value]="c.progressPercent" />
              </div>
            }
          } @else {
            <p class="text-muted">Aucun cours commencé. <a routerLink="/courses">Explorer.</a></p>
          }
        </app-card>
      </div>

      <!-- Topic strengths / weaknesses -->
      <div class="grid two">
        <app-card title="Points forts (≥ 75% de réussite)">
          @if (strengths().length) {
            @for (t of strengths(); track t.topic) {
              <div class="topic-row strong">
                <span class="material-symbols-outlined">star</span>
                <span class="topic-name">{{ t.topic }}</span>
                <span>{{ t.correctAnswers }}/{{ t.questionsAnswered }}</span>
                <span class="badge badge-success">{{ t.accuracyPercent ? t.accuracyPercent.toFixed(0) : '0' }}%</span>
              </div>
            }
          } @else {
            <p class="text-muted">Aucun point fort identifié (minimum 3 réponses par thème requis).</p>
          }
        </app-card>

        <app-card title="À réviser (&lt; 50% de réussite)">
          @if (weaknesses().length) {
            @for (t of weaknesses(); track t.topic) {
              <div class="topic-row weak">
                <span class="material-symbols-outlined">warning</span>
                <span class="topic-name">{{ t.topic }}</span>
                <span>{{ t.correctAnswers }}/{{ t.questionsAnswered }}</span>
                <span class="badge badge-danger">{{ t.accuracyPercent ? t.accuracyPercent.toFixed(0) : '0' }}%</span>
              </div>
            }
          } @else {
            <p class="text-muted">Aucun thème faible détecté.</p>
          }
        </app-card>
      </div>

      <!-- Attempt history -->
      <app-card title="Historique des tentatives de quiz" class="results">
        @if (attempts().length) {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Cours</th>
                  <th>Score</th>
                  <th>Résultat</th>
                  <th>Date</th>
                  <th>Durée</th>
                </tr>
              </thead>
              <tbody>
                @for (a of attempts(); track a.attemptId) {
                  <tr>
                    <td>{{ a.quizTitle }}</td>
                    <td class="text-muted">{{ a.courseTitle }}</td>
                    <td>{{ a.correctCount }}/{{ a.questionCount }}</td>
                    <td>
                      <span class="badge"
                            [class.badge-success]="a.passed"
                            [class.badge-danger]="!a.passed">
                        {{ a.scorePercent != null ? a.scorePercent.toFixed(0) : '0' }}% — {{ a.passed ? 'Réussi' : 'Échoué' }}
                      </span>
                    </td>
                    <td class="text-muted">{{ formatDate(a.submittedAt ?? a.startedAt) }}</td>
                    <td class="text-muted">{{ a.timeSpentSeconds ? (a.timeSpentSeconds / 60).toFixed(0) + ' min' : '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-empty-state icon="quiz" message="Aucune tentative de quiz enregistrée.">
            <a class="btn btn-primary" routerLink="/quizzes" style="margin-top: var(--space-3);">
              Passer un quiz
            </a>
          </app-empty-state>
        }
      </app-card>
    }
  `,
  styles: [`
    .state-msg { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-4); color: var(--color-text-muted); }
    .state-msg.error { color: var(--color-danger); }
    .state-msg .btn { margin-left: var(--space-2); }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .two { margin: var(--space-4) 0; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
    .results { display: block; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px var(--space-3); text-align: left; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
    th { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-muted); }
    .prog-row { margin-bottom: var(--space-3); }
    .prog-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-1); font-size: 0.9rem; }
    .topic-row { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-border); &:last-child { border-bottom: 0; } }
    .topic-row.strong .material-symbols-outlined { color: var(--color-success); }
    .topic-row.weak .material-symbols-outlined { color: var(--color-warning); }
    .topic-name { flex: 1; font-size: 0.9rem; }
  `]
})
export class PerformancePage implements OnInit {
  private readonly perfService = inject(PerformanceService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly attempts = signal<AttemptResult[]>([]);
  protected readonly topics = signal<TopicPerformance[]>([]);
  protected readonly progress = signal<CourseProgress[]>([]);

  protected readonly strengths = computed(() => this.topics().filter(t => t.classification === 'STRONG'));
  protected readonly weaknesses = computed(() => this.topics().filter(t => t.classification === 'WEAK'));

  protected readonly passedCount = computed(() => this.attempts().filter(a => a.passed).length);

  protected readonly avgScore = computed(() => {
    const list = this.attempts();
    if (!list.length) return '0.0';
    const sum = list.reduce((acc, a) => acc + (a.scorePercent ?? 0), 0);
    return (sum / list.length).toFixed(1);
  });

  protected readonly trendBars = computed<BarDatum[]>(() =>
    this.attempts().slice(-10).map(a => ({
      label: (a.quizTitle || 'Quiz').substring(0, 8) + '…',
      value: Math.round(a.scorePercent ?? 0),
    }))
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      attempts: this.perfService.getAttemptHistory(),
      topics: this.perfService.getTopicPerformance(),
      progress: this.perfService.getProgress(),
    }).subscribe({
      next: ({ attempts, topics, progress }) => {
        this.attempts.set(attempts ?? []);
        this.topics.set(topics ?? []);
        this.progress.set(progress ?? []);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
        console.error('Erreur chargement performance:', err);
        if (err.status === 0) {
          this.error.set('Impossible de contacter le serveur. Vérifiez que le backend (port 8082) est démarré.');
        } else if (err.status === 500) {
          this.error.set('Erreur serveur (500) : la base de données MySQL est inaccessible. Vérifiez que le conteneur MySQL est démarré (docker compose up -d).');
        } else if (err.error?.message) {
          this.error.set(err.error.message);
        } else {
          this.error.set('Impossible de charger les données de performance.');
        }
      }
    });
  }

  protected labelStatus(s: string): string {
    if (s === 'COMPLETED') return 'Terminé';
    if (s === 'IN_PROGRESS') return 'En cours';
    return 'Non commencé';
  }

  protected formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
}

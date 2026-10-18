import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PerformanceService } from '../../../core/services/performance.service';
import { DashboardStats } from '../../../core/models/api.model';
import { Card } from '../../../shared/components/card';
import { StatCard } from '../../../shared/components/stat-card';
import { BarChart, BarDatum } from '../../../shared/components/bar-chart';
import { ProgressBar } from '../../../shared/components/progress-bar';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-dashboard-page',
  imports: [Card, StatCard, BarChart, ProgressBar, PageHeader, RouterLink],
  template: `
    <app-page-header title="Tableau de bord" subtitle="Aperçu de votre progression en temps réel." />

    @if (loading()) {
      <div class="state-msg"><span class="material-symbols-outlined spin">progress_activity</span> Chargement…</div>
    } @else if (error()) {
      <div class="state-msg error">
        <span class="material-symbols-outlined">error</span>
        {{ error() }}
        <button class="btn" (click)="load()">Réessayer</button>
      </div>
    } @else if (stats(); as s) {
      <div class="grid">
        <app-stat-card label="Cours inscrits" [value]="s.totalCoursesEnrolled.toString()" icon="menu_book"
          [hint]="s.coursesInProgress + ' en cours, ' + s.coursesCompleted + ' terminés'" />
        <app-stat-card label="Progression globale" [value]="s.overallProgressPercent.toFixed(0) + '%'" icon="trending_up" />
        <app-stat-card label="Moyenne aux quiz" [value]="s.averageQuizScorePercent.toFixed(1) + '%'" icon="quiz"
          [hint]="s.totalQuizAttempts + ' tentative(s)'" />
        <app-stat-card label="Quiz complétés" [value]="s.totalQuizAttempts.toString()" icon="task_alt" />
      </div>

      <div class="grid sections">
        <!-- Course progress -->
        <app-card title="Progression par cours">
          @if (s.courseProgress.length) {
            @for (c of s.courseProgress.slice(0, 5); track c.courseId) {
              <div class="prog-row">
                <div class="prog-head">
                  <span class="prog-title">{{ c.courseTitle }}</span>
                  <span class="badge" [class.badge-success]="c.status === 'COMPLETED'"
                        [class.badge-warning]="c.status === 'IN_PROGRESS'">{{ labelStatus(c.status) }}</span>
                </div>
                <app-progress-bar [value]="c.progressPercent" />
              </div>
            }
          } @else {
            <p class="text-muted empty-hint">
              <span class="material-symbols-outlined">school</span>
              Aucun cours commencé. <a routerLink="/courses">Parcourir les cours.</a>
            </p>
          }
        </app-card>

        <!-- Score trend -->
        <app-card title="Évolution des scores (quiz)">
          @if (trendData().length) {
            <app-bar-chart [data]="trendData()" />
          } @else {
            <p class="text-muted empty-hint">
              <span class="material-symbols-outlined">quiz</span>
              Passez un quiz pour voir votre évolution. <a routerLink="/quizzes">Explorer les quiz.</a>
            </p>
          }
        </app-card>

        <!-- Topics -->
        @if (s.topicWeaknesses.length || s.topicStrengths.length) {
          <app-card title="Thèmes à réviser">
            @if (s.topicWeaknesses.length) {
              @for (t of s.topicWeaknesses.slice(0, 4); track t.topic) {
                <div class="topic-row weak">
                  <span class="material-symbols-outlined">trending_down</span>
                  <span class="topic-name">{{ t.topic }}</span>
                  <span class="badge badge-danger">{{ t.accuracyPercent.toFixed(0) }}%</span>
                </div>
              }
            } @else {
              <p class="text-muted">Aucun thème faible détecté (pas encore assez de données).</p>
            }
          </app-card>

          <app-card title="Points forts">
            @if (s.topicStrengths.length) {
              @for (t of s.topicStrengths.slice(0, 4); track t.topic) {
                <div class="topic-row strong">
                  <span class="material-symbols-outlined">trending_up</span>
                  <span class="topic-name">{{ t.topic }}</span>
                  <span class="badge badge-success">{{ t.accuracyPercent.toFixed(0) }}%</span>
                </div>
              }
            } @else {
              <p class="text-muted">Continuez à répondre aux quiz pour identifier vos points forts.</p>
            }
          </app-card>
        }

        <!-- Recent activities -->
        <app-card title="Activités récentes">
          @if (s.recentActivities.length) {
            @for (a of s.recentActivities.slice(0, 8); track a.id) {
              <div class="activity-row">
                <span class="material-symbols-outlined activity-icon">{{ activityIcon(a.type) }}</span>
                <div class="activity-body">
                  <span class="activity-desc">{{ a.description }}</span>
                  <span class="text-muted activity-date">{{ formatDate(a.createdAt) }}</span>
                </div>
              </div>
            }
          } @else {
            <p class="text-muted empty-hint">
              <span class="material-symbols-outlined">school</span>
              Aucune activité récente. Commencez un cours !
            </p>
          }
        </app-card>

        <!-- Recommendations link -->
        <app-card title="Recommandations IA">
          <p class="text-muted" style="margin-bottom: var(--space-3);">
            Obtenez des recommandations personnalisées basées sur vos résultats réels.
          </p>
          <a class="btn btn-primary" routerLink="/recommendations">
            <span class="material-symbols-outlined">lightbulb</span> Voir mes recommandations
          </a>
        </app-card>
      </div>
    }
  `,
  styles: [`
    .state-msg { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-4); color: var(--color-text-muted); }
    .state-msg.error { color: var(--color-danger); }
    .state-msg .btn { margin-left: var(--space-2); }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .sections { margin-top: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
    .prog-row { margin-bottom: var(--space-3); }
    .prog-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-1); }
    .prog-title { font-size: 0.9rem; font-weight: 500; }
    .topic-row { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-border); &:last-child { border-bottom: 0; } }
    .topic-row.weak .material-symbols-outlined { color: var(--color-danger); }
    .topic-row.strong .material-symbols-outlined { color: var(--color-success); }
    .topic-name { flex: 1; font-size: 0.9rem; }
    .activity-row { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-border); &:last-child { border-bottom: 0; } }
    .activity-icon { color: var(--color-primary); font-size: 20px; padding-top: 2px; }
    .activity-body { display: flex; flex-direction: column; gap: 2px; }
    .activity-desc { font-size: 0.9rem; }
    .activity-date { font-size: 0.78rem; }
    .empty-hint { display: flex; align-items: center; gap: var(--space-2); font-size: 0.9rem;
      .material-symbols-outlined { font-size: 18px; } }
  `]
})
export class DashboardPage implements OnInit {
  private readonly perfService = inject(PerformanceService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly stats = signal<DashboardStats | null>(null);

  protected readonly trendData = computed<BarDatum[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return s.scoreTrend.slice(-8).map((p: import('../../../core/models/api.model').ScoreTrendPoint) => ({
      label: p.quizTitle.substring(0, 8) + '…',
      value: Math.round(p.scorePercent),
    }));
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.perfService.getDashboard().subscribe({
      next: (data: DashboardStats) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
        console.error('Erreur chargement tableau de bord:', err);
        if (err.status === 0) {
          this.error.set('Impossible de contacter le serveur. Vérifiez que le backend (port 8082) est démarré.');
        } else if (err.status === 500) {
          this.error.set('Erreur serveur (500) : la base de données MySQL est inaccessible. Vérifiez que le conteneur MySQL est démarré (docker compose up -d).');
        } else if (err.error?.message) {
          this.error.set(err.error.message);
        } else {
          this.error.set('Impossible de charger le tableau de bord. Vérifiez que le backend et la base de données sont démarrés.');
        }
      },
    });
  }

  protected labelStatus(status: string): string {
    if (status === 'COMPLETED') return 'Terminé';
    if (status === 'IN_PROGRESS') return 'En cours';
    return 'Non commencé';
  }

  protected activityIcon(type: string): string {
    if (type === 'COURSE_STARTED') return 'play_circle';
    if (type === 'LESSON_COMPLETED') return 'check_circle';
    if (type === 'COURSE_COMPLETED') return 'emoji_events';
    if (type === 'QUIZ_ATTEMPTED') return 'quiz';
    return 'event';
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}

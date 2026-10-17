import { Component } from '@angular/core';
import { MOCK_COURSES, MOCK_RESULTS, WEEKLY_HOURS } from '../../../core/mocks/mock-data';
import { BarChart } from '../../../shared/components/bar-chart';
import { Card } from '../../../shared/components/card';
import { PageHeader } from '../../../shared/components/page-header';
import { ProgressBar } from '../../../shared/components/progress-bar';
import { StatCard } from '../../../shared/components/stat-card';

@Component({
  selector: 'app-performance-page',
  imports: [PageHeader, Card, StatCard, BarChart, ProgressBar],
  template: `
    <app-page-header title="Performance" subtitle="Suivez votre progression et vos résultats (données d'exemple)." />

    <div class="grid">
      <app-stat-card label="Moyenne générale" value="14,0/20" icon="grade" hint="+0,8 ce mois-ci" />
      <app-stat-card label="Temps d'étude (7 j)" value="19,5 h" icon="schedule" hint="objectif : 20 h" />
      <app-stat-card label="Quiz réussis" value="7/9" icon="task_alt" />
      <app-stat-card label="Série en cours" value="5 jours" icon="local_fire_department" />
    </div>

    <div class="grid two">
      <app-card title="Heures d'étude par jour">
        <app-bar-chart [data]="weekly" />
      </app-card>
      <app-card title="Progression par cours">
        @for (c of courses; track c.id) {
          <div class="item"><app-progress-bar [value]="c.progress" [label]="c.title" /></div>
        }
      </app-card>
    </div>

    <app-card title="Derniers résultats" class="results">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Activité</th><th>Type</th><th>Cours</th><th>Note</th><th>Date</th></tr></thead>
          <tbody>
            @for (r of results; track r.label + r.date) {
              <tr>
                <td>{{ r.label }}</td>
                <td><span class="badge">{{ r.kind }}</span></td>
                <td>{{ r.course }}</td>
                <td>
                  <span class="badge" [class.badge-success]="r.score >= 14"
                        [class.badge-warning]="r.score >= 10 && r.score < 14"
                        [class.badge-danger]="r.score < 10">{{ r.score }}/20</span>
                </td>
                <td class="text-muted">{{ r.date }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </app-card>
  `,
  styles: [`
    .two { margin: var(--space-4) 0; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
    .item { margin-bottom: var(--space-3); }
    .results { display: block; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px var(--space-3); text-align: left; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
    th { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-muted); }
  `]
})
export class PerformancePage {
  protected readonly weekly = WEEKLY_HOURS;
  protected readonly courses = MOCK_COURSES;
  protected readonly results = MOCK_RESULTS;
}

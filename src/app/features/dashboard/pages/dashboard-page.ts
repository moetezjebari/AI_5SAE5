import { Component } from '@angular/core';
import { Card } from '../../../shared/components/card';
import { StatCard } from '../../../shared/components/stat-card';

@Component({
  selector: 'app-dashboard-page',
  imports: [Card, StatCard],
  template: `
    <div class="page-header">
      <h1>Tableau de bord</h1>
      <p>Aperçu de votre progression (données d'exemple).</p>
    </div>

    <div class="grid">
      <app-stat-card label="Cours suivis" value="6" icon="menu_book" hint="2 en cours" />
      <app-stat-card label="Exercices réalisés" value="48" icon="edit_note" hint="+5 cette semaine" />
      <app-stat-card label="Moyenne aux quiz" value="14,2/20" icon="quiz" hint="en progression" />
      <app-stat-card label="Objectif hebdo" value="72%" icon="flag" hint="3h restantes" />
    </div>

    <div class="grid sections">
      <app-card title="Cours en cours">
        @for (c of courses; track c.name) {
          <div class="row">
            <div class="row-head"><span>{{ c.name }}</span><span class="badge">{{ c.progress }}%</span></div>
            <div class="progress"><span [style.width.%]="c.progress"></span></div>
          </div>
        }
      </app-card>
      <app-card title="Recommandations">
        @for (r of recos; track r) {
          <p class="reco"><span class="material-symbols-outlined">lightbulb</span> {{ r }}</p>
        }
      </app-card>
    </div>
  `,
  styles: [`
    .sections { margin-top: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
    .row { margin-bottom: var(--space-4); }
    .row-head { display: flex; justify-content: space-between; margin-bottom: var(--space-1); font-weight: 500; }
    .reco { display: flex; gap: var(--space-2); align-items: flex-start; }
    .reco .material-symbols-outlined { color: var(--color-warning); }
  `]
})
export class DashboardPage {
  protected readonly courses = [
    { name: 'Algorithmique', progress: 80 },
    { name: 'Bases de données', progress: 55 },
    { name: 'Réseaux', progress: 30 }
  ];
  protected readonly recos = [
    'Révisez les jointures SQL avant le prochain quiz.',
    'Refaites 3 exercices de récursivité.',
    'Planifiez une session de 30 min sur les réseaux.'
  ];
}

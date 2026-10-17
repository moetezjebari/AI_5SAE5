import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_RECOMMENDATIONS } from '../../../core/mocks/mock-data';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-recommendations-page',
  imports: [PageHeader, Card, EmptyState, RouterLink],
  template: `
    <app-page-header title="Recommandations personnalisées"
                     subtitle="Suggestions de l'IA selon votre progression et vos résultats.">
      <button class="btn btn-primary"><span class="material-symbols-outlined">refresh</span> Actualiser</button>
    </app-page-header>

    <div class="filters">
      @for (t of types; track t) {
        <button class="btn chip" [class.btn-primary]="type() === t" (click)="type.set(t)">{{ t }}</button>
      }
    </div>

    @if (filtered().length) {
      <div class="list">
        @for (r of filtered(); track r.id) {
          <app-card>
            <div class="row">
              <span class="material-symbols-outlined icon">{{ icons[r.type] }}</span>
              <div class="body">
                <div class="tags">
                  <span class="badge">{{ r.type }}</span>
                  <span class="badge"
                        [class.badge-danger]="r.priority === 'Haute'"
                        [class.badge-warning]="r.priority === 'Moyenne'"
                        [class.badge-success]="r.priority === 'Basse'">Priorité {{ r.priority.toLowerCase() }}</span>
                </div>
                <h3>{{ r.title }}</h3>
                <p class="text-muted"><span class="material-symbols-outlined">psychology</span> {{ r.reason }}</p>
              </div>
              <a class="btn" [routerLink]="r.link">Ouvrir</a>
            </div>
          </app-card>
        }
      </div>
    } @else {
      <app-empty-state message="Aucune recommandation dans cette catégorie." />
    }
  `,
  styles: [`
    .filters { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); }
    .chip { padding: 6px 14px; }
    .list { display: grid; gap: var(--space-3); }
    .row { display: flex; align-items: center; gap: var(--space-4); }
    .icon { padding: 10px; color: var(--color-primary); background: var(--color-primary-soft); border-radius: var(--radius-md); }
    .body { flex: 1; min-width: 0; }
    .tags { display: flex; gap: var(--space-2); margin-bottom: var(--space-2); }
    h3 { margin-bottom: var(--space-1); }
    p { margin: 0; font-size: 0.9rem; }
    p .material-symbols-outlined { font-size: 16px; }
    @media (max-width: 600px) { .row { flex-wrap: wrap; } }
  `]
})
export class RecommendationsPage {
  protected readonly types = ['Toutes', 'Cours', 'Exercice', 'Quiz', 'Méthode'];
  protected readonly type = signal('Toutes');
  protected readonly icons: Record<string, string> = {
    Cours: 'menu_book', Exercice: 'edit_note', Quiz: 'quiz', Méthode: 'tips_and_updates'
  };
  protected readonly filtered = computed(() =>
    MOCK_RECOMMENDATIONS.filter(r => this.type() === 'Toutes' || r.type === this.type()));
}

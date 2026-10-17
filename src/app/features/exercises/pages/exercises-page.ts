import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_EXERCISES } from '../../../core/mocks/mock-data';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-exercises-page',
  imports: [PageHeader, Card, EmptyState, RouterLink],
  template: `
    <app-page-header title="Exercices" subtitle="Entraînez-vous et suivez vos corrections." />

    <div class="filters">
      @for (d of difficulties; track d) {
        <button class="btn chip" [class.btn-primary]="difficulty() === d" (click)="difficulty.set(d)">{{ d }}</button>
      }
    </div>

    @if (filtered().length) {
      <div class="list">
        @for (e of filtered(); track e.id) {
          <app-card>
            <div class="row">
              <div class="info">
                <h3><a [routerLink]="['/exercises', e.id]">{{ e.title }}</a></h3>
                <span class="text-muted">{{ e.course }}</span>
              </div>
              <span class="badge"
                    [class.badge-success]="e.difficulty === 'Facile'"
                    [class.badge-warning]="e.difficulty === 'Moyen'"
                    [class.badge-danger]="e.difficulty === 'Difficile'">{{ e.difficulty }}</span>
              <span class="status text-muted">
                <span class="material-symbols-outlined">{{ e.status === 'Terminé' ? 'check_circle' : 'pending' }}</span>
                {{ e.status }}@if (e.score !== undefined) { · {{ e.score }}/20 }
              </span>
              <a class="btn" [routerLink]="['/exercises', e.id]">{{ e.status === 'Terminé' ? 'Revoir' : 'Commencer' }}</a>
            </div>
          </app-card>
        }
      </div>
    } @else {
      <app-empty-state message="Aucun exercice pour ce niveau." />
    }
  `,
  styles: [`
    .filters { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); }
    .chip { padding: 6px 14px; }
    .list { display: grid; gap: var(--space-3); }
    .row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-4); }
    .info { flex: 1 1 220px; }
    h3 { margin: 0; }
    h3 a { color: var(--color-text); }
    .status { display: flex; align-items: center; gap: var(--space-1); }
  `]
})
export class ExercisesPage {
  protected readonly difficulties = ['Tous', 'Facile', 'Moyen', 'Difficile'];
  protected readonly difficulty = signal('Tous');
  protected readonly filtered = computed(() =>
    MOCK_EXERCISES.filter(e => this.difficulty() === 'Tous' || e.difficulty === this.difficulty()));
}

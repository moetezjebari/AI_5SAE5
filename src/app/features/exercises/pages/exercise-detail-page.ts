import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MOCK_EXERCISES } from '../../../core/mocks/mock-data';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-exercise-detail-page',
  imports: [PageHeader, Card, EmptyState, FormsModule, RouterLink],
  template: `
    @if (exercise(); as e) {
      <app-page-header [title]="e.title" [subtitle]="e.course + ' · ' + e.difficulty">
        <a class="btn" routerLink="/exercises"><span class="material-symbols-outlined">arrow_back</span> Retour</a>
      </app-page-header>

      <div class="layout">
        <div class="main">
          <app-card title="Énoncé"><p>{{ e.statement }}</p></app-card>
          <app-card title="Votre réponse">
            <div class="form-field">
              <textarea rows="8" [(ngModel)]="answer" placeholder="Rédigez votre solution…"></textarea>
            </div>
            <button class="btn btn-primary" (click)="submitted.set(true)">Soumettre</button>
            @if (submitted()) {
              <p class="feedback"><span class="material-symbols-outlined">task_alt</span>
                Réponse enregistrée. La correction détaillée sera disponible une fois l'évaluation connectée.</p>
            }
          </app-card>
        </div>
        <aside>
          <app-card title="Indices">
            @for (h of e.hints; track h; let i = $index) {
              @if (i < shown()) {
                <p class="hint"><span class="material-symbols-outlined">lightbulb</span> {{ h }}</p>
              }
            }
            @if (shown() < e.hints.length) {
              <button class="btn btn-block" (click)="shown.set(shown() + 1)">Afficher un indice</button>
            } @else {
              <p class="text-muted">Plus d'indices.</p>
            }
          </app-card>
        </aside>
      </div>
    } @else {
      <app-empty-state icon="error" message="Exercice introuvable." />
    }
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 1fr 320px; gap: var(--space-4); align-items: start; }
    .main { display: grid; gap: var(--space-4); }
    textarea { width: 100%; padding: 10px 12px; font: inherit; color: var(--color-text); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .hint { display: flex; gap: var(--space-2); }
    .hint .material-symbols-outlined { color: var(--color-warning); }
    .feedback { display: flex; gap: var(--space-2); margin: var(--space-4) 0 0; color: var(--color-success); }
    @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } }
  `]
})
export class ExerciseDetailPage {
  readonly id = input.required<string>();
  protected readonly exercise = computed(() => MOCK_EXERCISES.find(e => e.id === this.id()));
  protected answer = '';
  protected readonly shown = signal(0);
  protected readonly submitted = signal(false);
}

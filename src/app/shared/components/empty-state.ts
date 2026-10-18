import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <span class="material-symbols-outlined">{{ icon() }}</span>
    <p>{{ message() }}</p>
    <ng-content />
  `,
  styles: [`
    :host { display: grid; place-items: center; gap: var(--space-2); padding: var(--space-6); color: var(--color-text-muted); text-align: center; }
    .material-symbols-outlined { font-size: 40px; }
    p { margin: 0; }
  `]
})
export class EmptyState {
  readonly icon = input('search_off');
  readonly message = input('Aucun résultat.');
}

import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  template: `
    @if (title()) {
      <h3 class="card-title">{{ title() }}</h3>
    }
    <ng-content />
  `,
  styles: [`
    :host {
      display: block;
      padding: var(--space-5);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }
    .card-title { margin-bottom: var(--space-4); }
  `]
})
export class Card {
  readonly title = input<string>();
}

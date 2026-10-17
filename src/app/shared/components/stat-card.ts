import { Component, input } from '@angular/core';
import { Card } from './card';

@Component({
  selector: 'app-stat-card',
  imports: [Card],
  template: `
    <app-card>
      <div class="stat">
        <span class="material-symbols-outlined icon">{{ icon() }}</span>
        <div>
          <div class="label">{{ label() }}</div>
          <div class="value">{{ value() }}</div>
          @if (hint()) {
            <div class="hint">{{ hint() }}</div>
          }
        </div>
      </div>
    </app-card>
  `,
  styles: [`
    .stat { display: flex; align-items: center; gap: var(--space-4); }
    .icon { padding: 10px; color: var(--color-primary); background: var(--color-primary-soft); border-radius: var(--radius-md); }
    .label { font-size: 0.85rem; color: var(--color-text-muted); }
    .value { font-size: 1.6rem; font-weight: 700; line-height: 1.2; }
    .hint { font-size: 0.8rem; color: var(--color-text-muted); }
  `]
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly icon = input('insights');
  readonly hint = input<string>();
}

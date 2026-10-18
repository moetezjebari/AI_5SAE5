import { Component, input } from '@angular/core';
import { Card } from './card';

@Component({
  selector: 'app-page-placeholder',
  imports: [Card],
  template: `
    <div class="page-header">
      <h1>{{ title() }}</h1>
      <p>Cette section sera développée dans une phase ultérieure.</p>
    </div>
    <app-card>
      <div class="empty">
        <span class="material-symbols-outlined">construction</span>
        <p>Contenu à venir</p>
      </div>
    </app-card>
  `,
  styles: [`
    .empty { display: grid; place-items: center; padding: var(--space-6); color: var(--color-text-muted); }
    .empty .material-symbols-outlined { font-size: 40px; }
  `]
})
export class PagePlaceholder {
  readonly title = input.required<string>();
}

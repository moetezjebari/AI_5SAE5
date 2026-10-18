import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="text">
      <h1>{{ title() }}</h1>
      @if (subtitle()) {
        <p>{{ subtitle() }}</p>
      }
    </div>
    <div class="actions"><ng-content /></div>
  `,
  styles: [`
    :host { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-5); }
    h1 { margin-bottom: var(--space-1); }
    p { margin: 0; color: var(--color-text-muted); }
    .actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  `]
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}

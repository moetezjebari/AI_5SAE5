import { Component, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  template: `
    @if (label()) {
      <div class="head"><span>{{ label() }}</span><span class="text-muted">{{ value() }}%</span></div>
    }
    <div class="progress"><span [style.width.%]="value()"></span></div>
  `,
  styles: [`
    .head { display: flex; justify-content: space-between; margin-bottom: var(--space-1); font-size: 0.9rem; font-weight: 500; }
  `]
})
export class ProgressBar {
  readonly value = input.required<number>();
  readonly label = input<string>();
}

import { Component, computed, input } from '@angular/core';

export interface BarDatum {
  label: string;
  value: number;
}

@Component({
  selector: 'app-bar-chart',
  template: `
    <div class="chart">
      @for (d of data(); track d.label) {
        <div class="col">
          <span class="val">{{ d.value }}</span>
          <div class="bar" [style.height.%]="(d.value / max()) * 100"></div>
          <span class="lbl">{{ d.label }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .chart { display: flex; align-items: flex-end; gap: var(--space-3); height: 180px; }
    .col { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: var(--space-1); }
    .bar { width: 100%; max-width: 40px; min-height: 4px; background: var(--color-primary); border-radius: var(--radius-sm) var(--radius-sm) 0 0; }
    .val { font-size: 0.75rem; color: var(--color-text-muted); }
    .lbl { font-size: 0.8rem; }
  `]
})
export class BarChart {
  readonly data = input.required<BarDatum[]>();
  protected readonly max = computed(() => Math.max(1, ...this.data().map(d => d.value)));
}

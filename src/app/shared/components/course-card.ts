import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Course } from '../../core/models/lms.model';
import { Card } from './card';
import { ProgressBar } from './progress-bar';

@Component({
  selector: 'app-course-card',
  imports: [Card, ProgressBar, RouterLink],
  template: `
    <app-card>
      <div class="top">
        <span class="badge">{{ course().category }}</span>
        <span class="text-muted">{{ course().level }}</span>
      </div>
      <h3><a [routerLink]="['/courses', course().id]">{{ course().title }}</a></h3>
      <p class="text-muted desc">{{ course().description }}</p>
      <p class="meta text-muted">
        <span class="material-symbols-outlined">person</span> {{ course().teacher }}
        · <span class="material-symbols-outlined">schedule</span> {{ course().durationHours }} h
      </p>
      <app-progress-bar [value]="course().progress" label="Progression" />
      <div class="card-actions">
        <a class="btn btn-sm" [routerLink]="['/courses', course().id]">Détails</a>
        <a class="btn btn-sm btn-primary" [routerLink]="['/quizzes/generate']" [queryParams]="{ course: course().id }">
          <span class="material-symbols-outlined">auto_awesome</span> Quiz IA
        </a>
      </div>
    </app-card>
  `,
  styles: [`
    :host { display: block; }
    app-card { height: 100%; }
    .top { display: flex; justify-content: space-between; margin-bottom: var(--space-3); font-size: 0.85rem; }
    h3 a { color: var(--color-text); }
    .desc { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .meta { font-size: 0.85rem; }
    .meta .material-symbols-outlined { font-size: 16px; }
    .card-actions { display: flex; gap: var(--space-2); margin-top: var(--space-3); padding-top: var(--space-2); border-top: 1px solid var(--color-border); }
    .btn-sm { padding: 5px 10px; font-size: 0.8rem; }
    .btn-sm .material-symbols-outlined { font-size: 14px; }
  `]
})
export class CourseCard {
  readonly course = input.required<Course>();
}

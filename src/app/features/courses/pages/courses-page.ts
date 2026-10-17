import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_COURSES } from '../../../core/mocks/mock-data';
import { CourseCard } from '../../../shared/components/course-card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-courses-page',
  imports: [PageHeader, CourseCard, EmptyState, RouterLink],
  template: `
    <app-page-header title="Mes cours" subtitle="Parcourez vos cours et reprenez où vous vous êtes arrêté.">
      <a class="btn btn-primary" routerLink="/courses/summary">
        <span class="material-symbols-outlined">auto_awesome</span> Résumé IA
      </a>
    </app-page-header>

    <div class="filters">
      <input class="search" type="search" placeholder="Rechercher un cours…" [value]="query()"
             (input)="query.set($any($event.target).value)" />
      @for (c of categories; track c) {
        <button class="btn chip" [class.btn-primary]="category() === c" (click)="category.set(c)">{{ c }}</button>
      }
    </div>

    @if (filtered().length) {
      <div class="grid">
        @for (c of filtered(); track c.id) {
          <app-course-card [course]="c" />
        }
      </div>
    } @else {
      <app-empty-state message="Aucun cours ne correspond à votre recherche." />
    }
  `,
  styles: [`
    .filters { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-5); }
    .search { flex: 1 1 240px; padding: 9px 12px; font: inherit; color: var(--color-text); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .chip { padding: 6px 14px; }
    .grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
  `]
})
export class CoursesPage {
  protected readonly courses = MOCK_COURSES;
  protected readonly categories = ['Tous', ...new Set(MOCK_COURSES.map(c => c.category))];
  protected readonly query = signal('');
  protected readonly category = signal('Tous');

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    return this.courses.filter(c =>
      (this.category() === 'Tous' || c.category === this.category()) &&
      (c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)));
  });
}

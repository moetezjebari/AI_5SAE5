import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
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
      <a class="btn btn-outline" routerLink="/courses/create">
        <span class="material-symbols-outlined">add</span> Nouveau cours
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
          <div class="course-item">
            <app-course-card [course]="c" />
            <div class="course-actions">
              <a class="btn btn-outline" [routerLink]="['/courses', c.id]">
                <span class="material-symbols-outlined">visibility</span> Détails
              </a>
              <a class="btn btn-outline" [routerLink]="['/courses', c.id, 'edit']">
                <span class="material-symbols-outlined">edit</span> Modifier
              </a>
              <button
                type="button"
                class="btn btn-icon delete-btn"
                title="Supprimer ce cours"
                (click)="deleteCourse(c.id, $event)"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        }
      </div>
    } @else {
      <app-empty-state message="Aucun cours ne correspond à votre recherche." />
      <a class="btn btn-primary" routerLink="/courses/create" style="margin-top: var(--space-3);">
        <span class="material-symbols-outlined">add</span> Créer un nouveau cours
      </a>
    }
  `,
  styles: [`
    .filters { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-5); }
    .search { flex: 1 1 240px; padding: 9px 12px; font: inherit; color: var(--color-text); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .chip { padding: 6px 14px; }
    .grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    .course-item { display: flex; flex-direction: column; gap: var(--space-2); }
    .course-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; justify-content: flex-end; }
    .btn-outline { background: transparent; border: 1px solid var(--color-border); color: var(--color-text); padding: 8px 14px; font-size: 0.9rem; border-radius: var(--radius-md); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .btn-outline:hover { background: var(--color-bg); border-color: var(--color-primary); }
    .btn-outline .material-symbols-outlined { font-size: 18px; }
    .delete-btn { color: var(--color-text-muted); &:hover { color: var(--color-danger); border-color: var(--color-danger); } }
  `]
})
export class CoursesPage {
  private readonly courseService = inject(CourseService);

  protected readonly courses = this.courseService.courses;
  protected readonly categories = ['Tous', ...new Set(this.courses().map(c => c.category))];
  protected readonly query = signal('');
  protected readonly category = signal('Tous');

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    return this.courses().filter(c =>
      (this.category() === 'Tous' || c.category === this.category()) &&
      (c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)));
  });

  protected deleteCourse(id: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (confirm('Voulez-vous vraiment supprimer ce cours ?')) {
      this.courseService.deleteCourse(id);
    }
  }
}

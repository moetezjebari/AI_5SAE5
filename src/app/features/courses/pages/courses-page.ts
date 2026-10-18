import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackendCourseService } from '../../../core/services/backend-course.service';
import { ApiCourse, ApiCourseLevel, ApiStatus } from '../../../core/models/api.model';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-courses-page',
  imports: [PageHeader, EmptyState, RouterLink],
  template: `
    <app-page-header title="Cours" subtitle="Parcourez les cours publiés et reprenez votre progression.">
      <div class="header-actions">
        <a class="btn btn-primary" routerLink="/courses/create">
          <span class="material-symbols-outlined">add</span> Créer un cours
        </a>
      </div>
    </app-page-header>

    <div class="filters">
      <input class="search" type="search" placeholder="Rechercher…"
             [value]="query()" (input)="query.set($any($event.target).value)" />
      @for (lvl of levels; track lvl.value) {
        <button class="btn chip" [class.btn-primary]="levelFilter() === lvl.value"
                (click)="levelFilter.set(lvl.value)">{{ lvl.label }}</button>
      }
    </div>

    @if (loading()) {
      <div class="state-msg"><span class="material-symbols-outlined spin">progress_activity</span> Chargement…</div>
    } @else if (error()) {
      <div class="state-msg error">
        <span class="material-symbols-outlined">error</span> {{ error() }}
        <button class="btn" (click)="load()">Réessayer</button>
      </div>
    } @else if (filtered().length) {
      <div class="grid">
        @for (c of filtered(); track c.id) {
          <div class="course-card">
            <div class="card-inner">
              <div class="card-top">
                <span class="subject-badge">{{ c.subject }}</span>
                <span class="level-badge level-{{ c.level.toLowerCase() }}">{{ labelLevel(c.level) }}</span>
              </div>
              <h3 class="card-title">{{ c.title }}</h3>
              <p class="card-desc text-muted">{{ c.description }}</p>
              <div class="card-foot">
                <span class="meta"><span class="material-symbols-outlined">schedule</span> {{ (c.estimatedDurationMinutes / 60).toFixed(0) }} h</span>
                <span class="meta"><span class="material-symbols-outlined">person</span> {{ c.createdByName }}</span>
              </div>
              <div class="course-actions">
                <a class="btn btn-primary btn-sm" [routerLink]="['/courses', c.id]">
                  <span class="material-symbols-outlined">visibility</span> Détails
                </a>
                <a class="btn btn-outline btn-sm" [routerLink]="['/courses', c.id, 'edit']">
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
          </div>
        }
      </div>
    } @else {
      <app-empty-state message="Aucun cours ne correspond à votre recherche.">
        <a class="btn btn-primary" routerLink="/courses/create" style="margin-top: var(--space-3);">
          <span class="material-symbols-outlined">add</span> Créer un nouveau cours
        </a>
      </app-empty-state>
    }
  `,
  styles: [`
    .filters { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-5); }
    .search { flex: 1 1 240px; padding: 9px 12px; font: inherit; color: var(--color-text); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .chip { padding: 6px 14px; }
    .state-msg { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-4); color: var(--color-text-muted); }
    .state-msg.error { color: var(--color-danger); }
    .state-msg .btn { margin-left: var(--space-2); }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-4); }
    .course-card { text-decoration: none; color: inherit; border-radius: var(--radius-lg); background: var(--color-surface); border: 1px solid var(--color-border); transition: box-shadow 0.15s ease, border-color 0.15s ease;
      &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); border-color: var(--color-primary); } }
    .card-inner { padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); height: 100%; }
    .card-top { display: flex; justify-content: space-between; align-items: center; gap: var(--space-2); }
    .subject-badge { font-size: 0.78rem; padding: 3px 8px; background: var(--color-primary-soft); color: var(--color-primary); border-radius: var(--radius-sm); font-weight: 600; }
    .level-badge { font-size: 0.78rem; padding: 3px 8px; border-radius: var(--radius-sm); font-weight: 600; }
    .level-debutant { background: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success); }
    .level-intermediaire { background: color-mix(in srgb, var(--color-warning) 20%, transparent); color: var(--color-warning); }
    .level-avance { background: color-mix(in srgb, var(--color-danger) 15%, transparent); color: var(--color-danger); }
    .card-title { font-size: 1rem; font-weight: 700; margin: 0; line-height: 1.3; }
    .card-desc { font-size: 0.87rem; margin: 0; line-height: 1.5; flex: 1;
      overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
    .card-foot { display: flex; gap: var(--space-3); margin-top: auto; }
    .meta { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: var(--color-text-muted);
      .material-symbols-outlined { font-size: 16px; } }
    .course-actions { display: flex; gap: var(--space-2); margin-top: var(--space-3); padding-top: var(--space-2); border-top: 1px solid var(--color-border); align-items: center; flex-wrap: wrap; }
    .btn-sm { padding: 4px 10px; font-size: 0.82rem; }
    .btn-outline { background: transparent; border: 1px solid var(--color-border); color: var(--color-text); border-radius: var(--radius-md); cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
    .btn-outline:hover { background: var(--color-bg); border-color: var(--color-primary); }
    .delete-btn { margin-left: auto; color: var(--color-text-muted); background: transparent; border: none; cursor: pointer; padding: 4px; display: inline-flex; align-items: center; border-radius: var(--radius-sm); }
    .delete-btn:hover { color: var(--color-danger); background: color-mix(in srgb, var(--color-danger) 12%, transparent); }
    .header-actions { display: flex; gap: var(--space-2); }
  `]
})
export class CoursesPage implements OnInit {
  private readonly courseService = inject(BackendCourseService);
  private readonly authService = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly courses = signal<ApiCourse[]>([]);
  protected readonly query = signal('');
  protected readonly levelFilter = signal<ApiCourseLevel | 'ALL'>('ALL');

  protected readonly levels: { label: string; value: ApiCourseLevel | 'ALL' }[] = [
    { label: 'Tous', value: 'ALL' },
    { label: 'Débutant', value: 'DEBUTANT' },
    { label: 'Intermédiaire', value: 'INTERMEDIAIRE' },
    { label: 'Avancé', value: 'AVANCE' },
  ];

  protected readonly isTeacherOrAdmin = computed(() => {
    const role = this.authService.user()?.role;
    return role === 'TEACHER' || role === 'ADMIN';
  });

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    const lvl = this.levelFilter();
    return this.courses().filter(c =>
      (lvl === 'ALL' || c.level === lvl) &&
      (!q || c.title.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.courseService.search({ status: 'PUBLISHED', size: 100 }).subscribe({
      next: page => {
        this.courses.set(page.content);
        this.loading.set(false);
      },
      error: err => {
        this.error.set('Impossible de charger les cours. Vérifiez que le backend est démarré.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  protected deleteCourse(id: number, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (confirm('Voulez-vous vraiment supprimer ce cours ?')) {
      this.courseService.delete(id).subscribe({
        next: () => {
          this.load();
        },
        error: (err) => {
          alert('Impossible de supprimer ce cours. Assurez-vous d\'être connecté avec un compte enseignant ou administrateur.');
          console.error(err);
        }
      });
    }
  }

  protected labelLevel(level: ApiCourseLevel): string {
    if (level === 'DEBUTANT') return 'Débutant';
    if (level === 'INTERMEDIAIRE') return 'Intermédiaire';
    return 'Avancé';
  }
}

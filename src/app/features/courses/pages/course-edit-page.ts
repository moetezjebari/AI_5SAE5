import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../../../core/services/course.service';
import { Course, CourseModule, Lesson } from '../../../core/models/lms.model';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-course-edit-page',
  standalone: true,
  imports: [FormsModule, Card, EmptyState, PageHeader],
  template: `
    <app-page-header
      [title]="editMode ? 'Modifier le cours' : 'Creer un cours'"
      [subtitle]="editMode ? 'Modifiez les informations du cours.' : 'Creez un nouveau cours manuellement.'">
      <a class="btn" routerLink="/courses"><span class="material-symbols-outlined">arrow_back</span> Retour a la liste</a>
    </app-page-header>

    <app-card>
      <form #f="ngForm" (ngSubmit)="save()">
        <div class="form-field">
          <label>Titre du cours <span class="required">*</span></label>
          <input type="text" name="title" [(ngModel)]="form.title" required />
        </div>

        <div class="form-field">
          <label>Categorie</label>
          <input type="text" name="category" [(ngModel)]="form.category" placeholder="Ex. Informatique" />
        </div>

        <div class="form-field">
          <label>Niveau <span class="required">*</span></label>
          <select name="level" [(ngModel)]="form.level" required>
            <option value="Debutant">Debutant</option>
            <option value="Intermediaire">Intermediaire</option>
            <option value="Avance">Avance</option>
          </select>
        </div>

        <div class="form-field">
          <label>Enseignant</label>
          <input type="text" name="teacher" [(ngModel)]="form.teacher" placeholder="Ex. Dr. Sana Ben Ali" />
        </div>

        <div class="form-field">
          <label>Description</label>
          <textarea name="description" [(ngModel)]="form.description" rows="3" placeholder="Presentation du cours…"></textarea>
        </div>

        <div class="form-field">
          <label>Progression (%)</label>
          <input type="number" name="progress" [(ngModel)]="form.progress" min="0" max="100" />
        </div>

        <div class="form-field">
          <label>Duree (heures)</label>
          <input type="number" name="durationHours" [(ngModel)]="form.durationHours" min="0" />
        </div>

        <div class="form-field">
          <label>Sujets cles (separes par des virgules)</label>
          <input type="text" name="topics" [(ngModel)]="topicsInput" placeholder="Ex. SQL, Normalisation, Jointures" />
          <p class="text-muted hint">Exemple : SQL, Modele relationnel, Normalisation</p>
        </div>

        <div class="questions-section">
          <h3>Modules et lecons</h3>
          <button type="button" class="btn btn-secondary add-module" (click)="addModule()">
            <span class="material-symbols-outlined">add_circle</span> Ajouter un module
          </button>

          @for (m of form.modules; track m; let mi = $index) {
            <div class="module-card">
              <div class="module-header">
                <span class="badge">Module {{ mi + 1 }}</span>
                <button type="button" class="btn btn-icon remove-module" (click)="removeModule(mi)" title="Supprimer le module">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>

              <div class="form-field">
                <label>Titre du module</label>
                <input type="text" [name]="'mTitle-' + mi" [(ngModel)]="m.title" placeholder="Ex. Introduction" />
              </div>

              <div class="form-field">
                <label>Resume du module</label>
                <input type="text" [name]="'mSummary-' + mi" [(ngModel)]="m.summary" placeholder="Resume optionnel" />
              </div>

              <div class="lessons-row">
                <h4>Lecons</h4>
                <button type="button" class="btn btn-secondary add-lesson" (click)="addLesson(mi)">
                  <span class="material-symbols-outlined">add_circle</span> Ajouter une lecon
                </button>
                @for (l of m.lessons; track l; let li = $index) {
                  <div class="lesson-card">
                    <div class="lesson-header">
                      <span class="badge">Lecon {{ li + 1 }}</span>
                      <button type="button" class="btn btn-icon remove-lesson" (click)="removeLesson(mi, li)" title="Supprimer la lecon">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                    <div class="form-field">
                      <label>Titre de la lecon</label>
                      <input type="text" [name]="'lTitle-' + mi + '-' + li" [(ngModel)]="l.title" placeholder="Ex. Notation grand O" />
                    </div>
                    <div class="form-field">
                      <label>Duree</label>
                      <input type="text" [name]="'lDuration-' + mi + '-' + li" [(ngModel)]="l.duration" placeholder="Ex. 25 min" />
                    </div>
                    <div class="form-field">
                      <label>Terminee</label>
                      <input type="checkbox" [name]="'lDone-' + mi + '-' + li" [(ngModel)]="l.done" />
                    </div>
                    <div class="form-field">
                      <label>Contenu</label>
                      <textarea [name]="'lContent-' + mi + '-' + li" [(ngModel)]="l.content" rows="2"></textarea>
                    </div>
                  </div>
                } @empty {
                  <p class="text-muted">Aucune lecon ajoutee.</p>
                }
              </div>
            </div>
          } @empty {
            <p class="text-muted">Aucun module ajoute.</p>
          }
        </div>

        <div class="form-actions">
          <button type="button" class="btn" routerLink="/courses">Annuler</button>
          @if (editMode) {
            <button type="button" class="btn btn-danger" (click)="confirmDelete()">
              <span class="material-symbols-outlined">delete</span> Supprimer ce cours
            </button>
          }
          <button type="submit" class="btn btn-primary" [disabled]="!f.valid">
            <span class="material-symbols-outlined">save</span> {{ editMode ? 'Modifier' : 'Creer' }}
          </button>
        </div>
      </form>
    </app-card>

    @if (deleteConfirm) {
      <app-card class="confirm-card">
        <p>Voulez-vous vraiment supprimer le cours "{{ form.title }}" ? Cette action est irreversible.</p>
        <div class="confirm-actions">
          <button type="button" class="btn" (click)="cancelDelete()">Annuler</button>
          <button type="button" class="btn btn-danger" (click)="deleteCourse()">
            <span class="material-symbols-outlined">delete</span> Confirmer la suppression
          </button>
        </div>
      </app-card>
    }
  `,
  styles: [`
    .form-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--space-3); }
    .form-field label { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
    .form-field input, .form-field select, .form-field textarea {
      padding: 8px 10px; font: inherit; color: var(--color-text);
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }
    .form-field input:focus, .form-field select:focus, .form-field textarea:focus {
      outline: none; border-color: var(--color-primary);
    }
    .required { color: var(--color-danger); }
    .hint { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
    .questions-section { margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .questions-section h3 { font-size: 1rem; margin-bottom: var(--space-2); display: flex; align-items: center; gap: var(--space-2); }
    .add-module { padding: 6px 14px; font-size: 0.85rem; margin-bottom: var(--space-3); }
    .module-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-3); background: var(--color-surface); }
    .module-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
    .remove-module { color: var(--color-text-muted); padding: 4px; }
    .lessons-row { margin-top: var(--space-2); padding-top: var(--space-2); border-top: 1px dashed var(--color-border); }
    .lessons-row h4 { font-size: 0.9rem; margin: 0 0 var(--space-2) 0; color: var(--color-text-muted); }
    .add-lesson { padding: 4px 10px; font-size: 0.8rem; margin-bottom: var(--space-2); }
    .lesson-card { border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-2); margin-bottom: var(--space-2); background: var(--color-bg); }
    .lesson-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-1); }
    .remove-lesson { color: var(--color-text-muted); padding: 2px; font-size: 0.8rem; }
    .form-actions { display: flex; gap: var(--space-2); justify-content: flex-end; margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px solid var(--color-border); }
    .confirm-card { margin-top: var(--space-4); background: color-mix(in srgb, var(--color-danger) 8%, transparent); border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent); }
    .confirm-actions { display: flex; gap: var(--space-2); justify-content: flex-end; margin-top: var(--space-3); }
    .btn-secondary { background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); padding: 6px 14px; font-size: 0.85rem; border-radius: var(--radius-md); cursor: pointer; }
    .btn-secondary:hover { background: var(--color-bg); }
    .btn-icon { background: transparent; border: none; color: inherit; cursor: pointer; padding: 4px; }
  `]
})
export class CourseEditPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly courseService = inject(CourseService);

  protected editMode = false;
  protected deleteConfirm = false;
  protected topicsInput = '';

  protected form: Course = {
    id: '',
    title: '',
    category: '',
    level: 'Débutant',
    teacher: '',
    description: '',
    progress: 0,
    durationHours: 0,
    modules: [],
    topics: []
  };

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const course = this.courseService.getById(id);
      if (course) {
        this.editMode = true;
        this.form = { ...course };
        this.topicsInput = (course.topics ?? []).join(', ');
      } else {
        this.router.navigate(['/courses']);
      }
    }
  }

  protected addModule(): void {
    const newModule: CourseModule = {
      title: '',
      summary: '',
      lessons: []
    };
    this.form.modules = [...this.form.modules, newModule];
  }

  protected removeModule(index: number): void {
    this.form.modules = this.form.modules.filter((_, i) => i !== index);
  }

  protected addLesson(moduleIndex: number): void {
    const newLesson: Lesson = {
      title: '',
      duration: '',
      done: false
    };
    this.form.modules[moduleIndex].lessons = [...this.form.modules[moduleIndex].lessons, newLesson];
  }

  protected removeLesson(moduleIndex: number, lessonIndex: number): void {
    this.form.modules[moduleIndex].lessons = this.form.modules[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
  }

  protected save(): void {
    const f = this.form;
    if (!f.title || !f.level) return;

    f.topics = this.topicsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

    const courseToSave: Course = {
      ...f,
      id: f.id || 'custom-' + Date.now(),
      topics: f.topics
    };

    this.courseService.saveCourse(courseToSave);
    this.router.navigate(['/courses']);
  }

  protected confirmDelete(): void {
    this.deleteConfirm = true;
  }

  protected cancelDelete(): void {
    this.deleteConfirm = false;
  }

  protected deleteCourse(): void {
    if (this.form.id) {
      this.courseService.deleteCourse(this.form.id);
    }
    this.router.navigate(['/courses']);
  }
}

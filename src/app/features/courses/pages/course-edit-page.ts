import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BackendCourseService } from '../../../core/services/backend-course.service';
import { CourseService } from '../../../core/services/course.service';
import { ApiCourse, ApiCourseLevel, ApiStatus, CourseUpsertPayload } from '../../../core/models/api.model';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

interface EditableLesson {
  id?: number;
  title: string;
  content: string;
  topic: string;
  durationMinutes: number;
  position: number;
}

@Component({
  selector: 'app-course-edit-page',
  standalone: true,
  imports: [FormsModule, Card, PageHeader, RouterLink],
  template: `
    <app-page-header
      [title]="editMode ? 'Modifier le cours' : 'Créer un cours'"
      [subtitle]="editMode ? 'Modifiez les informations et les leçons du cours.' : 'Créez un nouveau cours enregistré dans la base de données.'">
      <a class="btn" routerLink="/courses"><span class="material-symbols-outlined">arrow_back</span> Retour à la liste</a>
    </app-page-header>

    @if (errorMessage()) {
      <div class="alert alert-danger">
        <span class="material-symbols-outlined">error</span>
        <span>{{ errorMessage() }}</span>
      </div>
    }

    <app-card>
      <form #f="ngForm" (ngSubmit)="save()">
        <div class="form-field">
          <label>Titre du cours <span class="required">*</span></label>
          <input type="text" name="title" [(ngModel)]="title" required placeholder="Ex. Développement Web Avancé" />
        </div>

        <div class="form-field">
          <label>Matière / Catégorie <span class="required">*</span></label>
          <input type="text" name="subject" [(ngModel)]="subject" required placeholder="Ex. Informatique" />
        </div>

        <div class="form-row">
          <div class="form-field flex-1">
            <label>Niveau <span class="required">*</span></label>
            <select name="level" [(ngModel)]="level" required>
              <option value="DEBUTANT">Débutant</option>
              <option value="INTERMEDIAIRE">Intermédiaire</option>
              <option value="AVANCE">Avancé</option>
            </select>
          </div>

          <div class="form-field flex-1">
            <label>Statut</label>
            <select name="status" [(ngModel)]="status">
              <option value="PUBLISHED">Publié</option>
              <option value="DRAFT">Brouillon</option>
            </select>
          </div>

          <div class="form-field flex-1">
            <label>Durée estimée (minutes)</label>
            <input type="number" name="estimatedDurationMinutes" [(ngModel)]="estimatedDurationMinutes" min="0" step="15" />
          </div>
        </div>

        <div class="form-field">
          <label>Description du cours</label>
          <textarea name="description" [(ngModel)]="description" rows="3" placeholder="Présentation synthétique des objectifs pédagogiques…"></textarea>
        </div>

        <div class="lessons-section">
          <div class="section-header">
            <h3>
              <span class="material-symbols-outlined">menu_book</span>
              Leçons du cours ({{ lessons.length }})
            </h3>
            <button type="button" class="btn btn-secondary btn-sm" (click)="addLesson()">
              <span class="material-symbols-outlined">add_circle</span> Ajouter une leçon
            </button>
          </div>

          @for (l of lessons; track l; let li = $index) {
            <div class="lesson-card">
              <div class="lesson-header">
                <span class="lesson-num">Leçon {{ li + 1 }}</span>
                <button type="button" class="btn btn-icon remove-lesson" (click)="removeLesson(li)" title="Supprimer la leçon">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>

              <div class="form-field">
                <label>Titre de la leçon <span class="required">*</span></label>
                <input type="text" [name]="'lTitle-' + li" [(ngModel)]="l.title" required placeholder="Ex. Introduction aux composants" />
              </div>

              <div class="form-row">
                <div class="form-field flex-1">
                  <label>Thème / Notions</label>
                  <input type="text" [name]="'lTopic-' + li" [(ngModel)]="l.topic" placeholder="Ex. Composants standalone" />
                </div>
                <div class="form-field flex-1">
                  <label>Durée (minutes)</label>
                  <input type="number" [name]="'lDuration-' + li" [(ngModel)]="l.durationMinutes" min="1" />
                </div>
              </div>

              <div class="form-field">
                <label>Contenu pédagogique</label>
                <textarea [name]="'lContent-' + li" [(ngModel)]="l.content" rows="3" placeholder="Contenu explicatif de la leçon…"></textarea>
              </div>
            </div>
          } @empty {
            <p class="text-muted empty-note">Aucune leçon ajoutée pour le moment. Cliquez sur "Ajouter une leçon" pour enrichir le cours.</p>
          }
        </div>

        <div class="form-actions">
          <button type="button" class="btn" routerLink="/courses">Annuler</button>
          @if (editMode) {
            <button type="button" class="btn btn-danger" (click)="confirmDelete()">
              <span class="material-symbols-outlined">delete</span> Supprimer ce cours
            </button>
          }
          <button type="submit" class="btn btn-primary" [disabled]="!f.valid || saving()">
            <span class="material-symbols-outlined">{{ saving() ? 'progress_activity' : 'save' }}</span>
            {{ saving() ? 'Enregistrement…' : (editMode ? 'Mettre à jour' : 'Créer le cours') }}
          </button>
        </div>
      </form>
    </app-card>

    @if (deleteConfirm) {
      <app-card class="confirm-card">
        <p>Voulez-vous vraiment supprimer définitivement le cours "{{ title }}" ? Cette action est irréversible.</p>
        <div class="confirm-actions">
          <button type="button" class="btn" (click)="cancelDelete()">Annuler</button>
          <button type="button" class="btn btn-danger" (click)="deleteCourse()" [disabled]="saving()">
            <span class="material-symbols-outlined">delete</span> Confirmer la suppression
          </button>
        </div>
      </app-card>
    }
  `,
  styles: [`
    .alert-danger {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4);
      background: color-mix(in srgb, var(--color-danger) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
      color: var(--color-danger); border-radius: var(--radius-md); font-size: 0.9rem;
    }
    .form-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--space-3); }
    .form-field label { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
    .form-field input, .form-field select, .form-field textarea {
      padding: 9px 12px; font: inherit; color: var(--color-text);
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }
    .form-field input:focus, .form-field select:focus, .form-field textarea:focus {
      outline: none; border-color: var(--color-primary);
    }
    .form-row { display: flex; gap: var(--space-3); flex-wrap: wrap; }
    .flex-1 { flex: 1 1 180px; }
    .required { color: var(--color-danger); }
    .lessons-section { margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
    .section-header h3 { font-size: 1.05rem; display: flex; align-items: center; gap: var(--space-2); margin: 0; }
    .lesson-card {
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-4); margin-bottom: var(--space-3); background: var(--color-bg);
    }
    .lesson-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
    .lesson-num { font-weight: 700; font-size: 0.85rem; color: var(--color-primary); }
    .remove-lesson { color: var(--color-text-muted); cursor: pointer; background: transparent; border: none; }
    .remove-lesson:hover { color: var(--color-danger); }
    .empty-note { font-size: 0.9rem; padding: var(--space-3) 0; }
    .form-actions {
      display: flex; gap: var(--space-2); justify-content: flex-end;
      margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px solid var(--color-border);
    }
    .confirm-card {
      margin-top: var(--space-4);
      background: color-mix(in srgb, var(--color-danger) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent);
    }
    .confirm-actions { display: flex; gap: var(--space-2); justify-content: flex-end; margin-top: var(--space-3); }
    .btn-secondary { background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); border-radius: var(--radius-md); cursor: pointer; }
    .btn-secondary:hover { background: var(--color-bg); }
    .btn-icon { background: transparent; border: none; color: inherit; cursor: pointer; padding: 4px; }
    .btn-sm { padding: 5px 12px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 4px; }
  `]
})
export class CourseEditPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly backendCourseService = inject(BackendCourseService);
  private readonly mockCourseService = inject(CourseService);

  protected editMode = false;
  protected courseId: number | null = null;
  protected deleteConfirm = false;
  protected saving = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected title = '';
  protected subject = '';
  protected level: ApiCourseLevel = 'DEBUTANT';
  protected status: ApiStatus = 'PUBLISHED';
  protected estimatedDurationMinutes = 120;
  protected description = '';
  protected lessons: EditableLesson[] = [];

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId && !isNaN(Number(paramId))) {
      this.editMode = true;
      this.courseId = Number(paramId);
      this.loadCourse(this.courseId);
    } else {
      // Default initial lesson
      this.lessons = [
        { title: 'Introduction et objectifs', topic: 'Général', durationMinutes: 30, content: '', position: 1 }
      ];
    }
  }

  private loadCourse(id: number): void {
    this.backendCourseService.getById(id).subscribe({
      next: (course) => {
        this.title = course.title;
        this.subject = course.subject;
        this.level = course.level;
        this.status = course.status;
        this.estimatedDurationMinutes = course.estimatedDurationMinutes || 120;
        this.description = course.description || '';
        this.lessons = (course.lessons || []).map((l, idx) => ({
          id: l.id,
          title: l.title,
          content: l.content || '',
          topic: l.topic || '',
          durationMinutes: l.durationMinutes || 30,
          position: l.position || (idx + 1)
        }));
      },
      error: (err) => {
        console.error('Error loading course:', err);
        this.errorMessage.set('Impossible de charger le cours demandé.');
      }
    });
  }

  protected addLesson(): void {
    this.lessons.push({
      title: '',
      content: '',
      topic: this.subject || '',
      durationMinutes: 30,
      position: this.lessons.length + 1
    });
  }

  protected removeLesson(index: number): void {
    this.lessons.splice(index, 1);
    this.lessons.forEach((l, i) => l.position = i + 1);
  }

  protected save(): void {
    if (!this.title.trim() || !this.subject.trim()) {
      this.errorMessage.set('Le titre et la matière sont obligatoires.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const payload: CourseUpsertPayload = {
      title: this.title.trim(),
      subject: this.subject.trim(),
      level: this.level,
      status: this.status,
      estimatedDurationMinutes: Number(this.estimatedDurationMinutes) || 60,
      description: this.description.trim(),
      lessons: this.lessons.map((l, idx) => ({
        id: l.id,
        title: l.title.trim(),
        content: l.content.trim(),
        topic: l.topic.trim() || this.subject.trim(),
        durationMinutes: Number(l.durationMinutes) || 30,
        position: idx + 1
      }))
    };

    const request$ = (this.editMode && this.courseId)
      ? this.backendCourseService.update(this.courseId, payload)
      : this.backendCourseService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/courses']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err.error?.message || 'Erreur lors de l\'enregistrement. Assurez-vous d\'être connecté avec un compte enseignant ou administrateur.';
        this.errorMessage.set(msg);
        console.error('Save course error:', err);
      }
    });
  }

  protected confirmDelete(): void {
    this.deleteConfirm = true;
  }

  protected cancelDelete(): void {
    this.deleteConfirm = false;
  }

  protected deleteCourse(): void {
    if (!this.courseId) return;

    this.saving.set(true);
    this.backendCourseService.delete(this.courseId).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/courses']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err.error?.message || 'Impossible de supprimer ce cours. Seuls les enseignants et administrateurs y sont autorisés.';
        this.errorMessage.set(msg);
        console.error('Delete course error:', err);
      }
    });
  }
}

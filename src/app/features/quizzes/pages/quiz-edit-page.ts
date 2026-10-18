import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BackendQuizService } from '../../../core/services/backend-quiz.service';
import { BackendCourseService } from '../../../core/services/backend-course.service';
import { ApiCourse, ApiQuizDifficulty, ApiStatus, QuizUpsertPayload } from '../../../core/models/api.model';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

interface EditableOption {
  id?: number;
  optionText: string;
  correct: boolean;
  position: number;
}

interface EditableQuestion {
  id?: number;
  questionText: string;
  topic: string;
  points: number;
  position: number;
  options: EditableOption[];
}

@Component({
  selector: 'app-quiz-edit-page',
  standalone: true,
  imports: [FormsModule, Card, PageHeader, RouterLink],
  template: `
    <app-page-header
      [title]="editMode ? 'Modifier le quiz' : 'Créer un quiz'"
      [subtitle]="editMode ? 'Modifiez les informations et les questions du quiz.' : 'Créez un nouveau quiz enregistré dans la base de données.'">
      <a class="btn" routerLink="/quizzes"><span class="material-symbols-outlined">arrow_back</span> Retour à la liste</a>
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
          <label>Cours associé <span class="required">*</span></label>
          <select name="courseId" [(ngModel)]="courseId" required>
            <option [ngValue]="null" disabled>Sélectionnez un cours…</option>
            @for (c of courses(); track c.id) {
              <option [ngValue]="c.id">{{ c.title }} ({{ c.subject }})</option>
            }
          </select>
        </div>

        <div class="form-field">
          <label>Titre du quiz <span class="required">*</span></label>
          <input type="text" name="title" [(ngModel)]="title" required placeholder="Ex. Évaluation des connaissances SQL" />
        </div>

        <div class="form-row">
          <div class="form-field flex-1">
            <label>Difficulté <span class="required">*</span></label>
            <select name="difficulty" [(ngModel)]="difficulty" required>
              <option value="FACILE">Facile</option>
              <option value="MOYEN">Moyen</option>
              <option value="DIFFICILE">Difficile</option>
            </select>
          </div>

          <div class="form-field flex-1">
            <label>Durée (minutes) <span class="required">*</span></label>
            <input type="number" name="durationMinutes" [(ngModel)]="durationMinutes" min="1" max="180" required />
          </div>

          <div class="form-field flex-1">
            <label>Score minimum requis (%) <span class="required">*</span></label>
            <input type="number" name="passingScore" [(ngModel)]="passingScore" min="10" max="100" step="5" required />
          </div>

          <div class="form-field flex-1">
            <label>Statut</label>
            <select name="status" [(ngModel)]="status">
              <option value="PUBLISHED">Publié</option>
              <option value="DRAFT">Brouillon</option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label>Description (optionnelle)</label>
          <textarea name="description" [(ngModel)]="description" rows="2" placeholder="Instructions ou contexte du quiz…"></textarea>
        </div>

        <div class="questions-section">
          <div class="section-header">
            <h3>
              <span class="material-symbols-outlined">quiz</span>
              Questions du quiz ({{ questions.length }})
            </h3>
            <button type="button" class="btn btn-secondary btn-sm" (click)="addQuestion()">
              <span class="material-symbols-outlined">add_circle</span> Ajouter une question
            </button>
          </div>

          @for (q of questions; track q; let qIdx = $index) {
            <div class="question-card">
              <div class="question-header">
                <span class="question-num">Question {{ qIdx + 1 }}</span>
                <button type="button" class="btn btn-icon remove-question" (click)="removeQuestion(qIdx)" title="Supprimer la question">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>

              <div class="form-field">
                <label>Énoncé de la question <span class="required">*</span></label>
                <input type="text" [name]="'qText-' + qIdx" [(ngModel)]="q.questionText" required placeholder="Ex. Quelle commande SQL permet de filtrer les résultats ?" />
              </div>

              <div class="form-row">
                <div class="form-field flex-1">
                  <label>Notion / Sujet</label>
                  <input type="text" [name]="'qTopic-' + qIdx" [(ngModel)]="q.topic" placeholder="Ex. Filtrage WHERE" />
                </div>
                <div class="form-field flex-1">
                  <label>Points</label>
                  <input type="number" [name]="'qPoints-' + qIdx" [(ngModel)]="q.points" min="1" max="10" />
                </div>
              </div>

              <label class="options-title">Options de réponse (cochez la bonne réponse) :</label>
              <div class="options-list">
                @for (opt of q.options; track opt; let oIdx = $index) {
                  <div class="option-item" [class.is-correct]="opt.correct">
                    <input
                      type="radio"
                      [name]="'correctOption-' + qIdx"
                      [checked]="opt.correct"
                      (change)="selectCorrectOption(qIdx, oIdx)"
                      title="Marquer comme bonne réponse"
                    />
                    <span class="opt-badge">{{ ['A', 'B', 'C', 'D'][oIdx] }}</span>
                    <input
                      type="text"
                      [name]="'q' + qIdx + 'opt' + oIdx"
                      [(ngModel)]="opt.optionText"
                      required
                      placeholder="Texte du choix..."
                      class="opt-input"
                    />
                  </div>
                }
              </div>
            </div>
          } @empty {
            <p class="text-muted empty-note">Aucune question ajoutée pour l'instant. Cliquez sur "Ajouter une question" pour commencer.</p>
          }
        </div>

        <div class="form-actions">
          <button type="button" class="btn" routerLink="/quizzes">Annuler</button>
          @if (editMode) {
            <button type="button" class="btn btn-danger" (click)="confirmDelete()">
              <span class="material-symbols-outlined">delete</span> Supprimer ce quiz
            </button>
          }
          <button type="submit" class="btn btn-primary" [disabled]="!f.valid || saving() || questions.length === 0">
            <span class="material-symbols-outlined">{{ saving() ? 'progress_activity' : 'save' }}</span>
            {{ saving() ? 'Enregistrement…' : (editMode ? 'Mettre à jour' : 'Créer le quiz') }}
          </button>
        </div>
      </form>
    </app-card>

    @if (deleteConfirm) {
      <app-card class="confirm-card">
        <p>Voulez-vous vraiment supprimer définitivement le quiz "{{ title }}" ? Cette action est irréversible.</p>
        <div class="confirm-actions">
          <button type="button" class="btn" (click)="cancelDelete()">Annuler</button>
          <button type="button" class="btn btn-danger" (click)="deleteQuiz()" [disabled]="saving()">
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
    .questions-section { margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
    .section-header h3 { font-size: 1.05rem; display: flex; align-items: center; gap: var(--space-2); margin: 0; }
    .question-card {
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-4); margin-bottom: var(--space-4); background: var(--color-bg);
    }
    .question-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
    .question-num { font-weight: 700; font-size: 0.9rem; color: var(--color-primary); }
    .remove-question { color: var(--color-text-muted); cursor: pointer; background: transparent; border: none; }
    .remove-question:hover { color: var(--color-danger); }
    .options-title { font-size: 0.85rem; font-weight: 600; margin: var(--space-2) 0 var(--space-1); display: block; }
    .options-list { display: flex; flex-direction: column; gap: var(--space-2); margin-top: 6px; }
    .option-item {
      display: flex; align-items: center; gap: var(--space-2);
      padding: 6px 10px; border-radius: var(--radius-md);
      background: var(--color-surface); border: 1px solid var(--color-border);
    }
    .option-item.is-correct {
      border-color: var(--color-success);
      background: color-mix(in srgb, var(--color-success) 8%, transparent);
    }
    .opt-badge { font-weight: 700; font-size: 0.85rem; color: var(--color-text-muted); width: 18px; }
    .opt-input { flex: 1; border: none !important; background: transparent !important; padding: 4px 6px !important; }
    .opt-input:focus { outline: none; }
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
export class QuizEditPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly quizService = inject(BackendQuizService);
  private readonly courseService = inject(BackendCourseService);

  protected editMode = false;
  protected quizId: number | null = null;
  protected deleteConfirm = false;
  protected saving = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected courses = signal<ApiCourse[]>([]);

  protected courseId: number | null = null;
  protected title = '';
  protected description = '';
  protected difficulty: ApiQuizDifficulty = 'MOYEN';
  protected durationMinutes = 10;
  protected passingScore = 50;
  protected status: ApiStatus = 'PUBLISHED';
  protected questions: EditableQuestion[] = [];

  ngOnInit(): void {
    this.loadCourses();

    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId && !isNaN(Number(paramId))) {
      this.editMode = true;
      this.quizId = Number(paramId);
      this.loadQuiz(this.quizId);
    } else {
      this.addQuestion();
    }
  }

  private loadCourses(): void {
    this.courseService.search({ status: 'PUBLISHED', size: 100 }).subscribe({
      next: (page) => {
        this.courses.set(page.content);
        if (!this.courseId && page.content.length > 0) {
          this.courseId = page.content[0].id;
        }
      },
      error: (err) => console.error('Failed to load courses:', err)
    });
  }

  private loadQuiz(id: number): void {
    this.quizService.getForManagement(id).subscribe({
      next: (quiz) => {
        this.courseId = quiz.courseId;
        this.title = quiz.title;
        this.description = quiz.description || '';
        this.difficulty = quiz.difficulty;
        this.durationMinutes = quiz.durationMinutes;
        this.passingScore = quiz.passingScore;
        this.status = quiz.status;
        this.questions = (quiz.questions || []).map((q, idx) => ({
          id: q.id,
          questionText: q.questionText,
          topic: q.topic || '',
          points: q.points || 1,
          position: q.position || (idx + 1),
          options: (q.options || []).map((o, oIdx) => ({
            id: o.id,
            optionText: o.optionText,
            correct: !!o.correct,
            position: o.position || (oIdx + 1)
          }))
        }));
      },
      error: (err) => {
        console.error('Error loading quiz for management:', err);
        this.errorMessage.set('Impossible de charger le quiz demandé.');
      }
    });
  }

  protected addQuestion(): void {
    const qIdx = this.questions.length + 1;
    this.questions.push({
      questionText: '',
      topic: '',
      points: 1,
      position: qIdx,
      options: [
        { optionText: '', correct: true, position: 1 },
        { optionText: '', correct: false, position: 2 },
        { optionText: '', correct: false, position: 3 },
        { optionText: '', correct: false, position: 4 },
      ]
    });
  }

  protected removeQuestion(index: number): void {
    this.questions.splice(index, 1);
    this.questions.forEach((q, i) => q.position = i + 1);
  }

  protected selectCorrectOption(questionIndex: number, optionIndex: number): void {
    this.questions[questionIndex].options.forEach((opt, idx) => {
      opt.correct = idx === optionIndex;
    });
  }

  protected save(): void {
    if (!this.courseId) {
      this.errorMessage.set('Veuillez sélectionner un cours pour ce quiz.');
      return;
    }
    if (!this.title.trim()) {
      this.errorMessage.set('Le titre du quiz est obligatoire.');
      return;
    }
    if (this.questions.length === 0) {
      this.errorMessage.set('Veuillez ajouter au moins une question.');
      return;
    }

    // Validate that each question has at least 2 non-empty options and exactly 1 correct answer
    for (let i = 0; i < this.questions.length; i++) {
      const q = this.questions[i];
      if (!q.questionText.trim()) {
        this.errorMessage.set(`Veuillez renseigner le texte de la question ${i + 1}.`);
        return;
      }
      const validOpts = q.options.filter(o => o.optionText.trim().length > 0);
      if (validOpts.length < 2) {
        this.errorMessage.set(`La question ${i + 1} doit avoir au moins 2 options valides.`);
        return;
      }
      const hasCorrect = q.options.some(o => o.correct && o.optionText.trim().length > 0);
      if (!hasCorrect) {
        this.errorMessage.set(`Veuillez cocher une réponse correcte non-vide pour la question ${i + 1}.`);
        return;
      }
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const payload: QuizUpsertPayload = {
      courseId: this.courseId,
      title: this.title.trim(),
      description: this.description.trim(),
      difficulty: this.difficulty,
      durationMinutes: Number(this.durationMinutes) || 10,
      passingScore: Number(this.passingScore) || 50,
      status: this.status,
      questions: this.questions.map((q, qIdx) => ({
        id: q.id,
        questionText: q.questionText.trim(),
        questionType: 'SINGLE_CHOICE',
        topic: q.topic.trim() || 'Général',
        points: Number(q.points) || 1,
        position: qIdx + 1,
        options: q.options
          .filter(o => o.optionText.trim().length > 0)
          .map((o, oIdx) => ({
            id: o.id,
            optionText: o.optionText.trim(),
            correct: o.correct,
            position: oIdx + 1
          }))
      }))
    };

    const request$ = (this.editMode && this.quizId)
      ? this.quizService.update(this.quizId, payload)
      : this.quizService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/quizzes']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err.error?.message || 'Erreur lors de l\'enregistrement du quiz. Seuls les enseignants et administrateurs y sont autorisés.';
        this.errorMessage.set(msg);
        console.error('Save quiz error:', err);
      }
    });
  }

  protected confirmDelete(): void {
    this.deleteConfirm = true;
  }

  protected cancelDelete(): void {
    this.deleteConfirm = false;
  }

  protected deleteQuiz(): void {
    if (!this.quizId) return;

    this.saving.set(true);
    this.quizService.delete(this.quizId).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/quizzes']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err.error?.message || 'Impossible de supprimer ce quiz. Seuls les enseignants et administrateurs y sont autorisés.';
        this.errorMessage.set(msg);
        console.error('Delete quiz error:', err);
      }
    });
  }
}

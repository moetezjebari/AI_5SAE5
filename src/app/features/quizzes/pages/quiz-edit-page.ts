import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuizService } from '../../../core/services/quiz.service';
import { Quiz, QuizQuestion } from '../../../core/models/lms.model';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-quiz-edit-page',
  standalone: true,
  imports: [FormsModule, Card, EmptyState, PageHeader],
  template: `
    <app-page-header
      [title]="editMode ? 'Modifier le quiz' : 'Creer un quiz'"
      [subtitle]="editMode ? 'Modifiez les informations et les questions du quiz.' : 'Creez un nouveau quiz manuellement.'">
      <a class="btn" routerLink="/quizzes"><span class="material-symbols-outlined">arrow_back</span> Retour a la liste</a>
    </app-page-header>

    <app-card>
      <form #f="ngForm" (ngSubmit)="save()">
        <div class="form-field">
          <label>Titre du quiz <span class="required">*</span></label>
          <input type="text" name="title" [(ngModel)]="form.title" required />
        </div>

        <div class="form-field">
          <label>Nom du cours (affiche)</label>
          <input type="text" name="course" [(ngModel)]="form.course" placeholder="Ex. Algorithme" />
        </div>

        <div class="form-field">
          <label>Identifiant du cours (optionnel)</label>
          <input type="text" name="courseId" [(ngModel)]="form.courseId" placeholder="Ex. algo" />
        </div>

        <div class="form-field">
          <label>Difficulte <span class="required">*</span></label>
          <select name="difficulty" [(ngModel)]="form.difficulty" required>
            <option value="Facile">Facile</option>
            <option value="Moyen">Moyen</option>
            <option value="Difficile">Difficile</option>
          </select>
        </div>

        <div class="form-field">
          <label>Duree (minutes) <span class="required">*</span></label>
          <input type="number" name="durationMin" [(ngModel)]="form.durationMin" min="1" required />
        </div>

        <div class="questions-section">
          <h3>Questions</h3>
          <button type="button" class="btn btn-secondary add-question" (click)="addQuestion()">
            <span class="material-symbols-outlined">add_circle</span> Ajouter une question
          </button>

          @for (q of form.questions; track q; let qIdx = $index) {
            <div class="question-card">
              <div class="question-header">
                <span class="badge">Question {{ qIdx + 1 }}</span>
                <button type="button" class="btn btn-icon remove-question" (click)="removeQuestion(qIdx)" title="Supprimer la question">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>

              <div class="form-field">
                <label>Intitule de la question</label>
                <input type="text" [name]="'qText-' + qIdx" [(ngModel)]="q.text" placeholder="Ex. Quelle est la capitale de la France ?" />
              </div>

              <div class="options-row">
                @for (opt of q.options; track opt; let oIdx = $index) {
                  <div class="form-field option-field">
                    <label>Option {{ oIdx + 1 }}</label>
                    <input type="text" [name]="'q' + qIdx + 'opt' + oIdx" [(ngModel)]="q.options[oIdx]" />
                  </div>
                }
              </div>

              <div class="form-field">
                <label>Index de la reponse correcte (0-{{ q.options.length - 1 }})</label>
                <input type="number" [name]="'qCorrect-' + qIdx" [(ngModel)]="q.correct" min="0" [max]="q.options.length - 1" />
              </div>

              <div class="form-field">
                <label>Explication (affichee apres correction)</label>
                <textarea [name]="'qExplanation-' + qIdx" [(ngModel)]="q.explanation" rows="2"></textarea>
              </div>
            </div>
          } @empty {
            <p class="text-muted">Aucune question ajoutee.</p>
          }
        </div>

        <div class="form-actions">
          <button type="button" class="btn" routerLink="/quizzes">Annuler</button>
          @if (editMode) {
            <button type="button" class="btn btn-danger" (click)="confirmDelete()">
              <span class="material-symbols-outlined">delete</span> Supprimer ce quiz
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
        <p>Voulez-vous vraiment supprimer le quiz "{{ form.title }}" ? Cette action est irreversible.</p>
        <div class="confirm-actions">
          <button type="button" class="btn" (click)="cancelDelete()">Annuler</button>
          <button type="button" class="btn btn-danger" (click)="deleteQuiz()">
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
    .questions-section { margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .questions-section h3 { font-size: 1rem; margin-bottom: var(--space-2); display: flex; align-items: center; gap: var(--space-2); }
    .add-question { padding: 6px 14px; font-size: 0.85rem; margin-bottom: var(--space-3); }
    .question-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-3); background: var(--color-surface); }
    .question-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
    .remove-question { color: var(--color-text-muted); padding: 4px; }
    .options-row { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-2); }
    .option-field { flex: 1; min-width: 120px; margin-bottom: 0; }
    .form-actions { display: flex; gap: var(--space-2); justify-content: flex-end; margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px solid var(--color-border); }
    .confirm-card { margin-top: var(--space-4); background: color-mix(in srgb, var(--color-danger) 8%, transparent); border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent); }
    .confirm-actions { display: flex; gap: var(--space-2); justify-content: flex-end; margin-top: var(--space-3); }
    .btn-secondary { background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); padding: 6px 14px; font-size: 0.85rem; border-radius: var(--radius-md); cursor: pointer; }
    .btn-secondary:hover { background: var(--color-bg); }
  `]
})
export class QuizEditPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly quizService = inject(QuizService);

  protected editMode = false;
  protected deleteConfirm = false;

  protected form: Quiz = {
    id: '',
    title: '',
    course: '',
    courseId: '',
    difficulty: 'Moyen',
    durationMin: 10,
    questions: [],
    isAiGenerated: false,
    createdAt: new Date().toISOString()
  };

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const quiz = this.quizService.getById(id);
      if (quiz) {
        this.editMode = true;
        this.form = { ...quiz };
      } else {
        this.router.navigate(['/quizzes']);
      }
    }
  }

  protected addQuestion(): void {
    const newQuestion: QuizQuestion = {
      text: '',
      options: ['', '', '', ''],
      correct: 0,
      explanation: ''
    };
    this.form.questions = [...this.form.questions, newQuestion];
  }

  protected removeQuestion(index: number): void {
    this.form.questions = this.form.questions.filter((_, i) => i !== index);
  }

  protected save(): void {
    const f = this.form;
    if (!f.title || !f.difficulty || !f.durationMin) return;

    f.questions.forEach(q => {
      while (q.options.length < 4) q.options.push('');
      if (q.options.length > 4) q.options.length = 4;
    });

    const quizToSave: Quiz = {
      ...f,
      id: f.id || 'custom-' + Date.now(),
      isAiGenerated: false,
      createdAt: f.createdAt || new Date().toISOString()
    };

    this.quizService.saveQuiz(quizToSave);
    this.router.navigate(['/quizzes']);
  }

  protected confirmDelete(): void {
    this.deleteConfirm = true;
  }

  protected cancelDelete(): void {
    this.deleteConfirm = false;
  }

  protected deleteQuiz(): void {
    if (this.form.id) {
      this.quizService.deleteQuiz(this.form.id);
    }
    this.router.navigate(['/quizzes']);
  }
}

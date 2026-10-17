import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { QuizService } from '../../../core/services/quiz.service';
import { AiQuizService } from '../../../core/services/ai-quiz.service';
import { Difficulty, Quiz } from '../../../core/models/lms.model';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-quiz-generator-page',
  imports: [PageHeader, Card, EmptyState, FormsModule, RouterLink],
  template: `
    <app-page-header title="Génération automatique de quiz IA" subtitle="Générez un quiz intelligent sur mesure à partir du contenu d'un cours.">
      <a class="btn" routerLink="/quizzes"><span class="material-symbols-outlined">arrow_back</span> Tous les quiz</a>
    </app-page-header>

    <div class="layout">
      <!-- Panneau de configuration de la génération -->
      <app-card title="Paramètres du quiz">
        <div class="form-field">
          <label for="course">Cours source</label>
          <select id="course" [(ngModel)]="courseId" (ngModelChange)="onCourseChange()">
            @for (c of courses(); track c.id) {
              <option [value]="c.id">{{ c.title }} ({{ c.category }})</option>
            }
          </select>
        </div>

        @if (selectedCourseTopics().length > 0) {
          <div class="form-field">
            <label>Sujets clés du cours</label>
            <div class="topic-chips">
              @for (t of selectedCourseTopics(); track t) {
                <button type="button" class="chip" [class.chip-active]="topic === t" (click)="selectTopic(t)">
                  {{ t }}
                </button>
              }
            </div>
          </div>
        }

        <div class="form-field">
          <label for="topic">Thème ou notion précise (optionnel)</label>
          <input id="topic" [(ngModel)]="topic" placeholder="Ex. : Tri rapide, Jointures SQL, Modèle OSI, Signals…" />
        </div>

        <div class="form-field">
          <label for="count">Nombre de questions : <strong>{{ count }}</strong></label>
          <input id="count" type="range" min="3" max="10" [(ngModel)]="count" />
          <div class="range-labels">
            <span>3</span>
            <span>5</span>
            <span>8</span>
            <span>10</span>
          </div>
        </div>

        <div class="form-field">
          <label for="difficulty">Difficulté souhaitée</label>
          <select id="difficulty" [(ngModel)]="difficulty">
            <option value="Facile">Facile (Notions et définitions)</option>
            <option value="Moyen">Moyen (Application et compréhension)</option>
            <option value="Difficile">Difficile (Cas complexes et pièges)</option>
          </select>
        </div>

        <!-- Section configuration Clé API IA -->
        <div class="ai-config-box">
          <div class="ai-header" (click)="toggleApiConfig()">
            <div class="ai-status">
              <span class="material-symbols-outlined" [class.active]="hasApiKey()">
                {{ hasApiKey() ? 'verified' : 'tune' }}
              </span>
              <div>
                <strong>Moteur IA : {{ hasApiKey() ? 'Google Gemini 1.5' : 'IA Contextuelle Locale' }}</strong>
                <p class="text-muted">{{ hasApiKey() ? 'Clé API active' : 'Prêt à l\'emploi sans clé (ou ajoutez Gemini)' }}</p>
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-subtle">
              {{ showApiConfig() ? 'Masquer' : 'Configurer' }}
            </button>
          </div>

          @if (showApiConfig()) {
            <div class="api-key-panel">
              <label for="apiKeyInput">Clé API Google Gemini (optionnel)</label>
              <div class="input-with-button">
                <input id="apiKeyInput" type="password" [(ngModel)]="apiKeyInput" placeholder="AIzaSy..." />
                <button class="btn btn-primary" type="button" (click)="saveApiKey()">Enregistrer</button>
              </div>
              <p class="hint">
                Obtenez une clé gratuite sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a>.
                Sans clé, le moteur IA local génère directement vos quiz à partir des cours.
              </p>
            </div>
          }
        </div>

        <button class="btn btn-primary btn-block generate-btn" (click)="generate()" [disabled]="loading()">
          <span class="material-symbols-outlined">{{ loading() ? 'hourglass_top' : 'auto_awesome' }}</span>
          {{ loading() ? 'Génération IA en cours…' : 'Générer le quiz avec l\'IA' }}
        </button>

        @if (errorMsg()) {
          <div class="alert alert-warning">
            <span class="material-symbols-outlined">warning</span>
            <span>{{ errorMsg() }}</span>
          </div>
        }
      </app-card>

      <!-- Aperçu et actions du quiz généré -->
      <app-card [title]="generatedQuiz() ? generatedQuiz()!.title : 'Aperçu du quiz généré'">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <h3>L'IA analyse le cours...</h3>
            <p class="text-muted">{{ loadingStep() }}</p>
          </div>
        } @else if (generatedQuiz(); as quiz) {
          <div class="quiz-meta-bar">
            <div class="meta-tags">
              <span class="badge">{{ quiz.course }}</span>
              <span class="badge" [class.badge-warning]="quiz.difficulty === 'Moyen'" [class.badge-danger]="quiz.difficulty === 'Difficile'">
                {{ quiz.difficulty }}
              </span>
              <span class="badge badge-success">
                <span class="material-symbols-outlined">timer</span> {{ quiz.durationMin }} min
              </span>
              <span class="badge badge-ai">
                <span class="material-symbols-outlined">psychology</span> {{ modelBadge() }}
              </span>
            </div>
            @if (saveSuccess()) {
              <div class="saved-alert">
                <span class="material-symbols-outlined">check_circle</span> Quiz enregistré dans vos quiz !
              </div>
            }
          </div>

          <div class="questions-list">
            @for (q of quiz.questions; track q.text; let i = $index) {
              <div class="question-block">
                <div class="q-header">
                  <span class="q-num">Question {{ i + 1 }} / {{ quiz.questions.length }}</span>
                </div>
                <h4 class="q-text">{{ q.text }}</h4>
                <div class="options-grid">
                  @for (opt of q.options; track opt; let oi = $index) {
                    <div class="option-item" [class.option-correct]="showAnswers() && oi === q.correct">
                      <span class="opt-bullet">{{ ['A', 'B', 'C', 'D'][oi] || (oi + 1) }}</span>
                      <span class="opt-label">{{ opt }}</span>
                      @if (showAnswers() && oi === q.correct) {
                        <span class="material-symbols-outlined check-icon">check_circle</span>
                      }
                    </div>
                  }
                </div>

                @if (showAnswers()) {
                  <div class="explanation-box">
                    <span class="material-symbols-outlined">info</span>
                    <div>
                      <strong>Explication pédagogique :</strong>
                      <p>{{ q.explanation }}</p>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <div class="actions-footer">
            <button class="btn" (click)="toggleAnswers()">
              <span class="material-symbols-outlined">{{ showAnswers() ? 'visibility_off' : 'visibility' }}</span>
              {{ showAnswers() ? 'Masquer' : 'Afficher' }} les réponses
            </button>
            <button class="btn" (click)="generate()" [disabled]="loading()">
              <span class="material-symbols-outlined">refresh</span> Régénérer
            </button>
            <button class="btn btn-secondary" (click)="saveQuiz()">
              <span class="material-symbols-outlined">bookmark_add</span> Enregistrer le quiz
            </button>
            <button class="btn btn-primary" (click)="takeQuizNow()">
              <span class="material-symbols-outlined">play_circle</span> Passer le quiz maintenant
            </button>
          </div>
        } @else {
          <app-empty-state
            icon="psychology"
            message="Sélectionnez un cours et cliquez sur 'Générer le quiz avec l'IA' pour concevoir une évaluation complète basée sur le contenu du cours."
          />
        }
      </app-card>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 380px 1fr; gap: var(--space-4); align-items: start; }
    .range-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px; }
    .topic-chips { display: flex; flex-wrap: wrap; gap: var(--space-1); margin-top: var(--space-1); }
    .chip {
      padding: 3px 8px;
      font-size: 0.78rem;
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--color-text);
      transition: all 0.15s ease;
      &:hover { border-color: var(--color-primary); color: var(--color-primary); }
      &.chip-active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    }
    .generate-btn { margin-top: var(--space-3); padding: 12px; font-size: 1rem; }
    .ai-config-box {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      margin-bottom: var(--space-4);
      background: color-mix(in srgb, var(--color-surface) 95%, var(--color-primary-soft));
    }
    .ai-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
    .ai-status {
      display: flex; gap: var(--space-2); align-items: center;
      strong { font-size: 0.88rem; }
      p { margin: 0; font-size: 0.76rem; }
      .material-symbols-outlined { color: var(--color-text-muted); &.active { color: var(--color-success); } }
    }
    .btn-sm { padding: 4px 10px; font-size: 0.8rem; }
    .btn-subtle { background: transparent; border: 1px solid var(--color-border); }
    .btn-secondary { background: var(--color-surface); border: 1px solid var(--color-primary); color: var(--color-primary); }
    .api-key-panel {
      margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--color-border);
      label { font-size: 0.82rem; font-weight: 500; display: block; margin-bottom: var(--space-1); }
      .hint { font-size: 0.76rem; color: var(--color-text-muted); margin-top: var(--space-1); a { color: var(--color-primary); text-decoration: underline; } }
    }
    .input-with-button { display: flex; gap: var(--space-2); input { flex: 1; } }
    .alert-warning {
      display: flex; gap: var(--space-2); align-items: center; padding: 10px;
      margin-top: var(--space-3); border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--color-warning) 12%, transparent);
      color: var(--color-warning); font-size: 0.85rem;
    }
    .loading-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: var(--space-6); text-align: center;
      .spinner {
        width: 48px; height: 48px; border: 4px solid var(--color-border);
        border-top-color: var(--color-primary); border-radius: 50%;
        animation: spin 0.8s linear infinite; margin-bottom: var(--space-4);
      }
      h3 { margin: 0 0 var(--space-2); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .quiz-meta-bar {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;
      gap: var(--space-2); margin-bottom: var(--space-4); padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--color-border);
    }
    .meta-tags { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
    .badge-ai { background: color-mix(in srgb, var(--color-primary) 15%, transparent); color: var(--color-primary); display: inline-flex; align-items: center; gap: 4px; }
    .saved-alert {
      display: inline-flex; align-items: center; gap: 4px; font-size: 0.85rem;
      color: var(--color-success); font-weight: 600;
    }
    .questions-list { display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-5); }
    .question-block {
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-4); background: var(--color-surface);
    }
    .q-header { margin-bottom: var(--space-2); }
    .q-num { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; color: var(--color-text-muted); }
    .q-text { margin: 0 0 var(--space-3); font-size: 1.05rem; }
    .options-grid { display: grid; gap: var(--space-2); }
    .option-item {
      display: flex; align-items: center; gap: var(--space-3); padding: 10px 14px;
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
      background: var(--color-bg); font-size: 0.92rem;
      .opt-bullet {
        width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
        border-radius: 50%; background: var(--color-border); font-size: 0.78rem; font-weight: 700;
      }
      .opt-label { flex: 1; }
      &.option-correct {
        border-color: var(--color-success);
        background: color-mix(in srgb, var(--color-success) 12%, transparent);
        font-weight: 600;
        .opt-bullet { background: var(--color-success); color: #fff; }
        .check-icon { color: var(--color-success); font-size: 20px; }
      }
    }
    .explanation-box {
      display: flex; gap: var(--space-3); margin-top: var(--space-3); padding: var(--space-3);
      border-radius: var(--radius-md); background: color-mix(in srgb, var(--color-primary-soft) 80%, transparent);
      color: var(--color-text); font-size: 0.88rem;
      .material-symbols-outlined { color: var(--color-primary); font-size: 20px; }
      p { margin: var(--space-1) 0 0; color: var(--color-text); }
    }
    .actions-footer {
      display: flex; flex-wrap: wrap; gap: var(--space-2); justify-content: flex-end;
      padding-top: var(--space-4); border-top: 1px solid var(--color-border);
    }
    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; }
      .actions-footer { justify-content: stretch; button { flex: 1 1 100%; } }
    }
  `]
})
export class QuizGeneratorPage implements OnInit {
  /** Reçoit le paramètre de requête ?course=... */
  readonly course = input<string>();

  private readonly courseService = inject(CourseService);
  private readonly quizService = inject(QuizService);
  private readonly aiQuizService = inject(AiQuizService);
  private readonly router = inject(Router);

  protected readonly courses = this.courseService.courses;
  protected courseId = '';
  protected topic = '';
  protected count = 5;
  protected difficulty: Difficulty = 'Moyen';

  protected readonly loading = signal(false);
  protected readonly loadingStep = signal('');
  protected readonly showAnswers = signal(false);
  protected readonly showApiConfig = signal(false);
  protected readonly generatedQuiz = signal<Quiz | null>(null);
  protected readonly modelBadge = signal('IA');
  protected readonly saveSuccess = signal(false);
  protected readonly errorMsg = signal('');

  protected apiKeyInput = '';

  ngOnInit(): void {
    const allCourses = this.courses();
    if (allCourses.length > 0) {
      this.courseId = allCourses[0].id;
    }

    const queryCourse = this.course();
    if (queryCourse && allCourses.some(c => c.id === queryCourse)) {
      this.courseId = queryCourse;
    }

    this.apiKeyInput = this.aiQuizService.getStoredApiKey();
  }

  protected selectedCourseTopics(): string[] {
    const c = this.courseService.getById(this.courseId);
    return c?.topics || [];
  }

  protected selectTopic(t: string): void {
    this.topic = this.topic === t ? '' : t;
  }

  protected onCourseChange(): void {
    this.topic = '';
  }

  protected hasApiKey(): boolean {
    return this.aiQuizService.hasApiKey() || !!this.apiKeyInput.trim();
  }

  protected toggleApiConfig(): void {
    this.showApiConfig.set(!this.showApiConfig());
  }

  protected saveApiKey(): void {
    this.aiQuizService.setStoredApiKey(this.apiKeyInput);
    this.showApiConfig.set(false);
  }

  protected toggleAnswers(): void {
    this.showAnswers.set(!this.showAnswers());
  }

  protected async generate(): Promise<void> {
    if (!this.courseId) return;

    this.loading.set(true);
    this.errorMsg.set('');
    this.saveSuccess.set(false);
    this.showAnswers.set(false);
    this.loadingStep.set('1/3 Extraction et analyse pédagogique des notions du cours...');

    try {
      await new Promise(r => setTimeout(r, 400));
      this.loadingStep.set('2/3 Formulation des questions et options distractrices par l\'IA...');

      const result = await this.aiQuizService.generateQuiz({
        courseId: this.courseId,
        topic: this.topic,
        difficulty: this.difficulty,
        count: Number(this.count),
        apiKey: this.apiKeyInput
      });

      this.loadingStep.set('3/3 Validation et mise en page du quiz...');
      await new Promise(r => setTimeout(r, 300));

      this.generatedQuiz.set(result.quiz);
      this.modelBadge.set(result.modelName);

      if (result.rawError) {
        this.errorMsg.set(`Note : ${result.rawError}. Le quiz a été généré avec succès par le moteur IA contextuel du cours.`);
      }
    } catch (e: any) {
      this.errorMsg.set(e.message || 'Une erreur est survenue lors de la génération.');
    } finally {
      this.loading.set(false);
    }
  }

  protected saveQuiz(): void {
    const q = this.generatedQuiz();
    if (!q) return;

    this.quizService.saveQuiz(q);
    this.saveSuccess.set(true);
  }

  protected takeQuizNow(): void {
    const q = this.generatedQuiz();
    if (!q) return;

    this.quizService.saveQuiz(q);
    this.router.navigate(['/quizzes', q.id]);
  }
}

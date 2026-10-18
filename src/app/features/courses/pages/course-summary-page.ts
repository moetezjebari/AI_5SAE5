import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { AiSummaryService, SummaryResult } from '../../../core/services/ai-summary.service';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-course-summary-page',
  imports: [PageHeader, Card, EmptyState, FormsModule, RouterLink],
  template: `
    <app-page-header
      title="Résumé automatique de cours par IA"
      subtitle="Générez instantanément une synthèse claire, des points clés et des fiches mémo à partir de vos cours."
    >
      <a class="btn" routerLink="/courses"><span class="material-symbols-outlined">arrow_back</span> Mes cours</a>
    </app-page-header>

    <div class="layout">
      <!-- Panneau de configuration du résumé -->
      <app-card title="Paramètres du résumé">
        <div class="form-field">
          <label for="course">Cours source</label>
          <select id="course" [(ngModel)]="courseId">
            @for (c of courses(); track c.id) {
              <option [value]="c.id">{{ c.title }}</option>
            }
          </select>
        </div>

        <div class="form-field">
          <label for="length">Format et profondeur du résumé</label>
          <select id="length" [(ngModel)]="length">
            <option value="Court">Court (Synthèse express en 3 min)</option>
            <option value="Moyen">Moyen (Fiche de révision complète)</option>
            <option value="Détaillé">Détaillé (Approfondi avec définitions et pièges)</option>
          </select>
        </div>

        <div class="form-field">
          <label for="text">Ou collez un extrait de cours spécifique (optionnel)</label>
          <textarea
            id="text"
            rows="5"
            [(ngModel)]="customText"
            placeholder="Collez ici un chapitre, des notes de TD ou un texte brut à résumer…"
          ></textarea>
        </div>

        <!-- Section configuration Clé API IA -->
        <div class="ai-config-box">
          <div class="ai-header" (click)="toggleApiConfig()">
            <div class="ai-status">
              <span class="material-symbols-outlined" [class.active]="hasApiKey()">
                {{ hasApiKey() ? 'verified' : 'tune' }}
              </span>
              <div>
                <strong>Moteur IA : {{ hasApiKey() ? 'Google Gemini 1.5' : 'Synthèse Pédagogique Locale' }}</strong>
                <p class="text-muted">{{ hasApiKey() ? 'Clé API active' : 'Prêt sans configuration (ou ajoutez Gemini)' }}</p>
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
              </p>
            </div>
          }
        </div>

        <button class="btn btn-primary btn-block generate-btn" (click)="generate()" [disabled]="loading()">
          <span class="material-symbols-outlined">{{ loading() ? 'hourglass_top' : 'auto_awesome' }}</span>
          {{ loading() ? 'Synthèse en cours…' : 'Générer le résumé avec l\'IA' }}
        </button>

        @if (copySuccess()) {
          <div class="alert alert-success">
            <span class="material-symbols-outlined">check_circle</span> Résumé copié dans le presse-papier !
          </div>
        }
      </app-card>

      <!-- Affichage du résumé généré -->
      <app-card [title]="summary() ? 'Synthèse IA : ' + summary()!.courseTitle : 'Aperçu du résumé'">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <h3>L'IA analyse le contenu du cours...</h3>
            <p class="text-muted">{{ loadingStep() }}</p>
          </div>
        } @else if (summary(); as s) {
          <div class="summary-result">
            <!-- Barre d'en-tête de métadonnées -->
            <div class="summary-meta">
              <div class="badges">
                <span class="badge">{{ s.length }}</span>
                <span class="badge badge-ai">
                  <span class="material-symbols-outlined">psychology</span> {{ s.modelUsed }}
                </span>
                <span class="text-muted date">Généré le {{ s.generatedAt }}</span>
              </div>

              <div class="quick-links">
                <button class="btn btn-sm" (click)="copySummary()" title="Copier le résumé">
                  <span class="material-symbols-outlined">content_copy</span> Copier
                </button>
                <button class="btn btn-sm" (click)="downloadSummary()" title="Télécharger en fichier texte">
                  <span class="material-symbols-outlined">download</span> Exporter
                </button>
              </div>
            </div>

            <!-- Vue d'ensemble -->
            <div class="section-box">
              <h3 class="section-title">
                <span class="material-symbols-outlined">article</span> Vue d'ensemble
              </h3>
              <p class="overview-text">{{ s.overview }}</p>
            </div>

            <!-- Points clés à retenir -->
            @if (s.keyPoints.length > 0) {
              <div class="section-box">
                <h3 class="section-title">
                  <span class="material-symbols-outlined">checklist</span> Points clés à retenir
                </h3>
                <ul class="key-points-list">
                  @for (kp of s.keyPoints; track kp) {
                    <li>
                      <span class="material-symbols-outlined check-icon">check_circle</span>
                      <span>{{ kp }}</span>
                    </li>
                  }
                </ul>
              </div>
            }

            <!-- Notions & définitions essentielles -->
            @if (s.essentialConcepts.length > 0) {
              <div class="section-box">
                <h3 class="section-title">
                  <span class="material-symbols-outlined">menu_book</span> Notions fondamentales & Définitions
                </h3>
                <div class="concepts-grid">
                  @for (c of s.essentialConcepts; track c.term) {
                    <div class="concept-card">
                      <strong class="concept-term">{{ c.term }}</strong>
                      <p class="concept-desc">{{ c.explanation }}</p>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Pièges et erreurs fréquentes à éviter -->
            @if (s.pitfalls.length > 0) {
              <div class="section-box pitfalls-box">
                <h3 class="section-title warning-title">
                  <span class="material-symbols-outlined">warning</span> Pièges et confusions fréquentes à éviter
                </h3>
                <ul class="pitfalls-list">
                  @for (p of s.pitfalls; track p) {
                    <li>{{ p }}</li>
                  }
                </ul>
              </div>
            }

            <!-- Mots-clés -->
            @if (s.keywords.length > 0) {
              <div class="section-box">
                <h3 class="section-title">
                  <span class="material-symbols-outlined">label</span> Mots-clés & Notions associées
                </h3>
                <div class="tags">
                  @for (k of s.keywords; track k) {
                    <span class="badge">{{ k }}</span>
                  }
                </div>
              </div>
            }

            <!-- Conseil méthodologique -->
            @if (s.studyAdvice) {
              <div class="advice-box">
                <span class="material-symbols-outlined advice-icon">tips_and_updates</span>
                <div>
                  <strong>Conseil méthodologique pour réviser :</strong>
                  <p>{{ s.studyAdvice }}</p>
                </div>
              </div>
            }

            <!-- Bouton d'action suivant : Tester ses connaissances par un Quiz IA -->
            <div class="summary-footer">
              <a class="btn btn-primary" routerLink="/quizzes/generate" [queryParams]="{ course: s.courseId }">
                <span class="material-symbols-outlined">auto_awesome</span> Générer un quiz IA à partir de ce cours
              </a>
            </div>
          </div>
        } @else {
          <app-empty-state
            icon="description"
            message="Sélectionnez un cours et cliquez sur 'Générer le résumé avec l'IA' pour obtenir une synthèse complète, des points clés et des fiches mémo personnalisées."
          />
        }
      </app-card>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 360px 1fr; gap: var(--space-4); align-items: start; }
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
    .api-key-panel {
      margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--color-border);
      label { font-size: 0.82rem; font-weight: 500; display: block; margin-bottom: var(--space-1); }
      .hint { font-size: 0.76rem; color: var(--color-text-muted); margin-top: var(--space-1); a { color: var(--color-primary); text-decoration: underline; } }
    }
    .input-with-button { display: flex; gap: var(--space-2); input { flex: 1; } }
    .alert-success {
      display: flex; gap: var(--space-2); align-items: center; padding: 10px;
      margin-top: var(--space-3); border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--color-success) 12%, transparent);
      color: var(--color-success); font-size: 0.85rem; font-weight: 600;
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
    .summary-result { display: flex; flex-direction: column; gap: var(--space-4); }
    .summary-meta {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;
      gap: var(--space-2); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border);
    }
    .badges { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
    .badge-ai {
      background: color-mix(in srgb, var(--color-primary) 15%, transparent);
      color: var(--color-primary); display: inline-flex; align-items: center; gap: 4px;
      .material-symbols-outlined { font-size: 15px; }
    }
    .date { font-size: 0.82rem; }
    .quick-links { display: flex; gap: var(--space-2); }
    .section-box { padding-bottom: var(--space-3); }
    .section-title {
      font-size: 1rem; margin: 0 0 var(--space-2); display: flex; align-items: center; gap: var(--space-2);
      color: var(--color-text);
      .material-symbols-outlined { font-size: 20px; color: var(--color-primary); }
    }
    .warning-title .material-symbols-outlined { color: var(--color-warning); }
    .overview-text {
      font-size: 0.98rem; line-height: 1.65; margin: 0; color: var(--color-text);
      white-space: pre-line;
    }
    .key-points-list {
      list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-2);
      li {
        display: flex; align-items: flex-start; gap: var(--space-2); font-size: 0.93rem; line-height: 1.5;
        .check-icon { color: var(--color-success); font-size: 18px; margin-top: 2px; }
      }
    }
    .concepts-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-3);
    }
    .concept-card {
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-3); background: var(--color-bg);
      .concept-term { font-size: 0.92rem; color: var(--color-primary); display: block; margin-bottom: 4px; }
      .concept-desc { font-size: 0.86rem; margin: 0; line-height: 1.45; color: var(--color-text); }
    }
    .pitfalls-box {
      border-radius: var(--radius-md); padding: var(--space-3);
      background: color-mix(in srgb, var(--color-warning) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-warning) 25%, transparent);
    }
    .pitfalls-list {
      margin: 0; padding-left: var(--space-4); font-size: 0.9rem;
      li { margin-bottom: 4px; color: var(--color-text); }
    }
    .tags { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .advice-box {
      display: flex; gap: var(--space-3); padding: var(--space-3);
      border-radius: var(--radius-md); background: color-mix(in srgb, var(--color-primary-soft) 80%, transparent);
      font-size: 0.9rem;
      .advice-icon { color: var(--color-primary); font-size: 24px; }
      p { margin: var(--space-1) 0 0; }
    }
    .summary-footer {
      display: flex; justify-content: flex-end; padding-top: var(--space-3);
      border-top: 1px solid var(--color-border);
    }
    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; }
      .summary-footer { justify-content: stretch; a { flex: 1; } }
    }
  `]
})
export class CourseSummaryPage implements OnInit {
  /** Liaison automatique du query param ?course=... */
  readonly course = input<string>();

  private readonly courseService = inject(CourseService);
  private readonly aiSummaryService = inject(AiSummaryService);
  private readonly router = inject(Router);

  protected readonly courses = this.courseService.courses;
  protected courseId = '';
  protected length: 'Court' | 'Moyen' | 'Détaillé' = 'Moyen';
  protected customText = '';

  protected readonly loading = signal(false);
  protected readonly loadingStep = signal('');
  protected readonly summary = signal<SummaryResult | null>(null);
  protected readonly showApiConfig = signal(false);
  protected readonly copySuccess = signal(false);

  protected apiKeyInput = '';

  ngOnInit(): void {
    const all = this.courses();
    if (all.length > 0) this.courseId = all[0].id;

    const queryCourse = this.course();
    if (queryCourse && all.some(c => c.id === queryCourse)) {
      this.courseId = queryCourse;
    }

    this.apiKeyInput = this.aiSummaryService.getStoredApiKey();
  }

  protected hasApiKey(): boolean {
    return this.aiSummaryService.hasApiKey() || !!this.apiKeyInput.trim();
  }

  protected toggleApiConfig(): void {
    this.showApiConfig.set(!this.showApiConfig());
  }

  protected saveApiKey(): void {
    this.aiSummaryService.setStoredApiKey(this.apiKeyInput);
    this.showApiConfig.set(false);
  }

  protected async generate(): Promise<void> {
    if (!this.courseId && !this.customText.trim()) return;

    this.loading.set(true);
    this.copySuccess.set(false);
    this.loadingStep.set('1/3 Lecture et extraction des concepts essentiels...');

    try {
      await new Promise(r => setTimeout(r, 400));
      this.loadingStep.set('2/3 Structuration pédagogique et rédaction de la synthèse...');

      const res = await this.aiSummaryService.generateSummary({
        courseId: this.courseId,
        length: this.length,
        customText: this.customText,
        apiKey: this.apiKeyInput
      });

      this.loadingStep.set('3/3 Finalisation des points clés et mise en page...');
      await new Promise(r => setTimeout(r, 200));

      this.summary.set(res);
    } catch (err) {
      console.error('Erreur lors de la génération du résumé:', err);
    } finally {
      this.loading.set(false);
    }
  }

  protected copySummary(): void {
    const s = this.summary();
    if (!s) return;

    const textToCopy = `SYNTHÈSE DE COURS : ${s.courseTitle}
Format : ${s.length} · ${s.modelUsed} · ${s.generatedAt}

1. VUE D'ENSEMBLE :
${s.overview}

2. POINTS CLÉS :
${s.keyPoints.map(kp => '- ' + kp).join('\n')}

3. NOTIONS FONDAMENTALES :
${s.essentialConcepts.map(c => `• ${c.term} : ${c.explanation}`).join('\n')}

4. PIÈGES À ÉVITER :
${s.pitfalls.map(p => '! ' + p).join('\n')}

5. MOTS-CLÉS :
${s.keywords.join(', ')}

6. CONSEIL DE RÉVISION :
${s.studyAdvice}
`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 3000);
    });
  }

  protected downloadSummary(): void {
    const s = this.summary();
    if (!s) return;

    const content = `# Synthèse de cours : ${s.courseTitle}
*Format : ${s.length} | Modèle : ${s.modelUsed} | Date : ${s.generatedAt}*

## 1. Vue d'ensemble
${s.overview}

## 2. Points clés à retenir
${s.keyPoints.map(kp => `- ${kp}`).join('\n')}

## 3. Notions fondamentales & Définitions
${s.essentialConcepts.map(c => `### ${c.term}\n${c.explanation}`).join('\n\n')}

## 4. Pièges et erreurs fréquentes à éviter
${s.pitfalls.map(p => `- ⚠️ ${p}`).join('\n')}

## 5. Mots-clés
${s.keywords.map(k => `\`${k}\``).join(' ')}

## 6. Conseil méthodologique
> 💡 ${s.studyAdvice}
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume-${s.courseId}-${s.length.toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

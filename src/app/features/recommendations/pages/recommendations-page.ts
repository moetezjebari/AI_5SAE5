import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { RecommendationApiService } from '../../../core/services/recommendation.service';
import { TeacherRecommendationService } from '../../../core/services/teacher-recommendation.service';
import {
  RecommendationResponse,
  RecommendationItem,
  QuizRecommendationResponse,
  QuizRecommendationItem,
  TeacherRecommendation,
  StudentOption,
  CourseOption,
} from '../../../core/models/api.model';
import { Card } from '../../../shared/components/card';
import { EmptyState } from '../../../shared/components/empty-state';
import { PageHeader } from '../../../shared/components/page-header';

type FilterType = 'Toutes' | 'COURSE' | 'QUIZ';

@Component({
  selector: 'app-recommendations-page',
  standalone: true,
  imports: [PageHeader, Card, EmptyState, RouterLink, FormsModule],
  template: `
    @if (isTeacherOrAdmin()) {
      <!-- ========================================== -->
      <!-- VIEW: TEACHER & ADMIN (CRUD MANAGEMENT)   -->
      <!-- ========================================== -->
      <app-page-header
        title="Gestion des Recommandations"
        subtitle="Recommandez des cours ciblés à des étudiants spécifiques pour guider leur parcours.">
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openCreateModal()">
            <span class="material-symbols-outlined">add</span> Nouvelle recommandation
          </button>
          <button class="btn" (click)="loadTeacherRecommendations()" [disabled]="teacherLoading()">
            <span class="material-symbols-outlined" [class.spin]="teacherLoading()">refresh</span> Actualiser
          </button>
        </div>
      </app-page-header>

      @if (actionSuccess()) {
        <div class="alert alert-success">
          <span class="material-symbols-outlined">check_circle</span>
          <span>{{ actionSuccess() }}</span>
        </div>
      }

      <!-- Filter / Search bar -->
      <div class="filters-bar">
        <input
          class="search-input"
          type="search"
          placeholder="Rechercher par étudiant, email, cours ou motif…"
          [value]="searchQuery()"
          (input)="searchQuery.set($any($event.target).value)" />

        <div class="filter-pills">
          @for (p of priorityFilters; track p.value) {
            <button
              class="btn chip"
              [class.btn-primary]="selectedPriority() === p.value"
              (click)="selectedPriority.set(p.value)">
              {{ p.label }}
            </button>
          }
        </div>
      </div>

      @if (teacherLoading()) {
        <div class="state-msg"><span class="material-symbols-outlined spin">progress_activity</span> Chargement des recommandations…</div>
      } @else if (teacherError()) {
        <div class="state-msg error">
          <span class="material-symbols-outlined">error</span> {{ teacherError() }}
          <button class="btn" (click)="loadTeacherRecommendations()">Réessayer</button>
        </div>
      } @else if (filteredTeacherRecs().length) {
        <div class="table-wrap">
          <table class="crud-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Cours recommandé</th>
                <th>Priorité</th>
                <th>Motif pédagogique</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (rec of filteredTeacherRecs(); track rec.id) {
                <tr>
                  <td>
                    <div class="student-cell">
                      <span class="student-name">{{ rec.studentName }}</span>
                      <span class="text-muted student-email">{{ rec.studentEmail }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="course-cell">
                      <span class="course-title">{{ rec.courseTitle }}</span>
                      @if (rec.courseSubject) {
                        <span class="badge course-badge">{{ rec.courseSubject }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span
                      class="badge"
                      [class.badge-danger]="rec.priority === 'HIGH'"
                      [class.badge-warning]="rec.priority === 'MEDIUM'"
                      [class.badge-success]="rec.priority === 'LOW'">
                      Priorité {{ labelPriority(rec.priority) }}
                    </span>
                  </td>
                  <td class="reason-cell">
                    <p class="reason-text">{{ rec.reason }}</p>
                  </td>
                  <td class="text-muted date-cell">{{ formatDate(rec.createdAt) }}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn btn-outline btn-sm" (click)="openEditModal(rec)" title="Modifier">
                        <span class="material-symbols-outlined">edit</span> Modifier
                      </button>
                      <button class="btn btn-danger-outline btn-sm" (click)="confirmDelete(rec)" title="Supprimer">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <app-empty-state icon="recommend" message="Aucune recommandation trouvée.">
          <p class="text-muted" style="margin-top: var(--space-2);">
            {{ searchQuery() ? 'Aucune recommandation ne correspond à vos filtres.' : 'Vous n\\'avez pas encore créé de recommandation de cours.' }}
          </p>
          <button class="btn btn-primary" (click)="openCreateModal()" style="margin-top: var(--space-3);">
            <span class="material-symbols-outlined">add</span> Recommander un cours
          </button>
        </app-empty-state>
      }

      <!-- Modal: Interactive Create / Edit Recommendation -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>
                <span class="material-symbols-outlined header-icon">
                  {{ modalEditMode() ? 'edit_note' : 'add_task' }}
                </span>
                {{ modalEditMode() ? 'Modifier la recommandation' : 'Recommander un cours à un étudiant' }}
              </h2>
              <button class="btn-close" (click)="closeModal()" aria-label="Fermer">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            @if (modalError()) {
              <div class="alert alert-danger">
                <span class="material-symbols-outlined">error</span>
                <span>{{ modalError() }}</span>
              </div>
            }

            <form (ngSubmit)="saveRecommendation()">
              <!-- 1. Student Field (Searchable input + dropdown selection) -->
              <div class="form-field">
                <div class="field-label-row">
                  <label for="studentInput">1. Étudiant cible <span class="required">*</span></label>
                  @if (selectedStudent()) {
                    <span class="selection-confirmed">
                      <span class="material-symbols-outlined">check_circle</span> Sélectionné
                    </span>
                  }
                </div>

                <div class="combobox-wrap">
                  <input
                    id="studentInput"
                    type="text"
                    class="interactive-input"
                    placeholder="Tapez le nom ou l'e-mail de l'étudiant…"
                    [value]="studentSearchText()"
                    (input)="onStudentSearchInput($any($event.target).value)"
                    (focus)="showStudentSuggestions.set(true)"
                    autocomplete="off" />

                  @if (showStudentSuggestions() && filteredStudents().length) {
                    <div class="dropdown-panel">
                      @for (s of filteredStudents(); track s.id) {
                        <div class="dropdown-item" (click)="selectStudent(s)">
                          <div class="item-primary">{{ s.lastName }} {{ s.firstName }}</div>
                          <div class="item-secondary text-muted">{{ s.email }}</div>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Quick selection chips if available -->
                <div class="quick-chips">
                  <span class="quick-chips-label">Suggestions rapides :</span>
                  @for (s of studentsList().slice(0, 3); track s.id) {
                    <button
                      type="button"
                      class="quick-chip"
                      [class.chip-active]="formStudentId === s.id"
                      (click)="selectStudent(s)">
                      {{ s.firstName }} {{ s.lastName }}
                    </button>
                  }
                </div>
              </div>

              <!-- 2. Course Field (Searchable input + dropdown selection) -->
              <div class="form-field">
                <div class="field-label-row">
                  <label for="courseInput">2. Cours à recommander <span class="required">*</span></label>
                  @if (selectedCourse()) {
                    <span class="selection-confirmed">
                      <span class="material-symbols-outlined">check_circle</span> Sélectionné
                    </span>
                  }
                </div>

                <div class="combobox-wrap">
                  <input
                    id="courseInput"
                    type="text"
                    class="interactive-input"
                    placeholder="Tapez le titre d'un cours ou choisissez dans la liste…"
                    [value]="courseSearchText()"
                    (input)="onCourseSearchInput($any($event.target).value)"
                    (focus)="showCourseSuggestions.set(true)"
                    autocomplete="off" />

                  @if (showCourseSuggestions() && filteredCourses().length) {
                    <div class="dropdown-panel">
                      @for (c of filteredCourses(); track c.id) {
                        <div class="dropdown-item" (click)="selectCourse(c)">
                          <div class="item-primary">{{ c.title }}</div>
                          <div class="item-secondary text-muted">{{ c.subject || 'Général' }} · {{ c.level || 'Tous niveaux' }}</div>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Select dropdown alternative -->
                <div class="select-fallback">
                  <select
                    [ngModel]="formCourseId"
                    (ngModelChange)="onSelectCourseChange($event)"
                    name="courseSelect"
                    class="secondary-select">
                    <option [ngValue]="null">Ou choisir directement dans la liste des cours…</option>
                    @for (c of coursesList(); track c.id) {
                      <option [ngValue]="c.id">{{ c.title }} ({{ c.subject || 'Cours' }})</option>
                    }
                  </select>
                </div>
              </div>

              <!-- 3. Priority Selection (Interactive segmented cards) -->
              <div class="form-field">
                <label>3. Niveau de priorité</label>
                <div class="priority-selector">
                  <button
                    type="button"
                    class="priority-card prio-high"
                    [class.active]="formPriority === 'HIGH'"
                    (click)="formPriority = 'HIGH'">
                    <span class="material-symbols-outlined">priority_high</span>
                    <span class="prio-text">Haute</span>
                  </button>
                  <button
                    type="button"
                    class="priority-card prio-med"
                    [class.active]="formPriority === 'MEDIUM'"
                    (click)="formPriority = 'MEDIUM'">
                    <span class="material-symbols-outlined">equalizer</span>
                    <span class="prio-text">Moyenne</span>
                  </button>
                  <button
                    type="button"
                    class="priority-card prio-low"
                    [class.active]="formPriority === 'LOW'"
                    (click)="formPriority = 'LOW'">
                    <span class="material-symbols-outlined">low_priority</span>
                    <span class="prio-text">Basse</span>
                  </button>
                </div>
              </div>

              <!-- 4. Pedagogical Reason / Message -->
              <div class="form-field">
                <label for="reasonInput">4. Conseil ou motif pédagogique <span class="required">*</span></label>
                <textarea
                  id="reasonInput"
                  [(ngModel)]="formReason"
                  name="reason"
                  rows="3"
                  required
                  placeholder="Ex. Je vous conseille de suivre ce cours pour consolider vos acquis et réussir le prochain quiz…"
                  [disabled]="modalSaving()"></textarea>

                <!-- Templates for quick advice -->
                <div class="template-chips">
                  <span class="quick-chips-label">Modèles types :</span>
                  <button
                    type="button"
                    class="template-chip"
                    (click)="applyTemplate('💡 Je vous recommande ce cours pour consolider les notions clés.')">
                    💡 Consolidation
                  </button>
                  <button
                    type="button"
                    class="template-chip"
                    (click)="applyTemplate('🚀 Recommandé comme suite logique pour approfondir vos compétences.')">
                    🚀 Approfondissement
                  </button>
                  <button
                    type="button"
                    class="template-chip"
                    (click)="applyTemplate('📚 Révision suggérée pour aborder sereinement les évaluations à venir.')">
                    📚 Révision
                  </button>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()" [disabled]="modalSaving()">
                  Annuler
                </button>
                <button
                  type="submit"
                  class="btn btn-primary submit-action"
                  [disabled]="modalSaving() || !isFormValid()">
                  <span class="material-symbols-outlined" [class.spin]="modalSaving()">
                    {{ modalSaving() ? 'progress_activity' : (modalEditMode() ? 'check' : 'send') }}
                  </span>
                  {{ modalSaving() ? 'Enregistrement…' : (modalEditMode() ? 'Mettre à jour' : 'Attribuer la recommandation') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Dialog -->
      @if (deletingRec(); as target) {
        <div class="modal-backdrop" (click)="cancelDelete()">
          <div class="modal-card modal-confirm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Confirmer la suppression</h2>
              <button class="btn-close" (click)="cancelDelete()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <p>
              Voulez-vous vraiment supprimer la recommandation du cours
              <strong>« {{ target.courseTitle }} »</strong> pour l'étudiant
              <strong>{{ target.studentName }}</strong> ?
            </p>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="cancelDelete()" [disabled]="deleteInProgress()">Annuler</button>
              <button class="btn btn-danger" (click)="executeDelete(target.id)" [disabled]="deleteInProgress()">
                <span class="material-symbols-outlined" [class.spin]="deleteInProgress()">
                  {{ deleteInProgress() ? 'progress_activity' : 'delete' }}
                </span>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      }

    } @else {
      <!-- ========================================== -->
      <!-- VIEW: STUDENT (DUAL CATEGORY RECOMMENDATIONS)-->
      <!-- ========================================== -->
      <app-page-header
        title="Recommandations d'apprentissage"
        subtitle="Découvrez vos recommandations de cours et les suggestions de quiz ciblées générées par l'IA.">
        @if (activeStudentTab() === 'courses') {
          <button class="btn btn-primary" (click)="loadStudentRecommendations()" [disabled]="studentLoading()">
            <span class="material-symbols-outlined" [class.spin]="studentLoading()">
              {{ studentLoading() ? 'progress_activity' : 'refresh' }}
            </span>
            Actualiser les cours
          </button>
        } @else {
          <button class="btn btn-primary" (click)="loadQuizRecommendations(true)" [disabled]="quizLoading()">
            <span class="material-symbols-outlined" [class.spin]="quizLoading()">
              {{ quizLoading() ? 'progress_activity' : 'refresh' }}
            </span>
            Régénérer avec Gemini
          </button>
        }
      </app-page-header>

      <!-- Category Navigation Tabs -->
      <div class="category-tabs">
        <button
          type="button"
          class="cat-tab"
          [class.cat-tab-active]="activeStudentTab() === 'courses'"
          (click)="setStudentTab('courses')">
          <span class="material-symbols-outlined">menu_book</span>
          <span class="cat-tab-title">Recommandations de cours</span>
          @if (studentResponse()?.recommendations?.length) {
            <span class="cat-pill">{{ studentResponse()?.recommendations?.length }}</span>
          }
        </button>

        <button
          type="button"
          class="cat-tab cat-tab-ai"
          [class.cat-tab-active]="activeStudentTab() === 'quizzes'"
          (click)="setStudentTab('quizzes')">
          <span class="material-symbols-outlined ai-sparkle">auto_awesome</span>
          <span class="cat-tab-title">Recommandations de quiz par IA</span>
          @if (quizResponse()?.recommendations?.length) {
            <span class="cat-pill cat-pill-ai">{{ quizResponse()?.recommendations?.length }}</span>
          }
        </button>
      </div>

      <!-- ========================================== -->
      <!-- TAB A: RECOMMANDATIONS DE COURS (UNTOUCHED)-->
      <!-- ========================================== -->
      @if (activeStudentTab() === 'courses') {
        @if (studentLoading()) {
          <div class="state-msg"><span class="material-symbols-outlined spin">progress_activity</span> Chargement des cours recommandés…</div>
        } @else if (studentError()) {
          <div class="state-msg error">
            <span class="material-symbols-outlined">error</span> {{ studentError() }}
            <button class="btn" (click)="loadStudentRecommendations()">Réessayer</button>
          </div>
        } @else if (studentResponse(); as r) {
          <!-- Source badge -->
          <div class="source-row">
            <span
              class="material-symbols-outlined"
              [class.ai-icon]="r.source === 'gemini'"
              [class.fallback-icon]="r.source !== 'gemini'">
              {{ r.source === 'gemini' ? 'auto_awesome' : 'school' }}
            </span>
            <span class="source-label">{{ r.source === 'gemini' ? 'Généré par Gemini AI' : 'Recommandations pédagogiques' }}</span>
            <span class="text-muted source-model">{{ r.modelUsed }}</span>
          </div>

          <!-- Summary -->
          @if (r.summary) {
            <div class="summary-card">
              <span class="material-symbols-outlined">psychology</span>
              <p>{{ r.summary }}</p>
            </div>
          }

          <!-- Filters -->
          <div class="filters">
            @for (t of filterTypes; track t) {
              <button class="btn chip" [class.btn-primary]="typeFilter() === t" (click)="typeFilter.set(t)">
                {{ labelType(t) }}
              </button>
            }
          </div>

          @if (filteredStudentRecs().length) {
            <div class="list">
              @for (item of filteredStudentRecs(); track item.resourceId + item.type + item.reason) {
                <app-card [class.card-teacher]="isTeacherAssigned(item)">
                  <div class="row">
                    <span class="material-symbols-outlined icon" [class.icon-teacher]="isTeacherAssigned(item)">
                      {{ isTeacherAssigned(item) ? 'school' : iconFor(item.type) }}
                    </span>
                    <div class="body">
                      <div class="tags">
                        <span class="badge">{{ labelType(item.type) }}</span>
                        @if (isTeacherAssigned(item)) {
                          <span class="badge badge-teacher">
                            <span class="material-symbols-outlined" style="font-size: 13px;">star</span>
                            Recommandé par l'enseignant
                          </span>
                        }
                        <span
                          class="badge"
                          [class.badge-danger]="item.priority === 'HIGH'"
                          [class.badge-warning]="item.priority === 'MEDIUM'"
                          [class.badge-success]="item.priority === 'LOW'">
                          Priorité {{ labelPriority(item.priority) }}
                        </span>
                      </div>
                      <h3>{{ item.title }}</h3>
                      <p class="text-muted reason">
                        <span class="material-symbols-outlined">{{ isTeacherAssigned(item) ? 'rate_review' : 'psychology' }}</span>
                        {{ item.reason }}
                      </p>
                    </div>
                    <a class="btn btn-primary" [routerLink]="actionLink(item)">
                      <span class="material-symbols-outlined">{{ item.action === 'START_QUIZ' ? 'play_arrow' : 'open_in_new' }}</span>
                      {{ item.action === 'START_QUIZ' ? 'Passer' : 'Ouvrir' }}
                    </a>
                  </div>
                </app-card>
              }
            </div>
          } @else {
            <app-empty-state message="Aucune recommandation dans cette catégorie." />
          }
        } @else {
          <!-- No data yet -->
          <app-empty-state icon="lightbulb" message="Aucune recommandation de cours disponible.">
            <p class="text-muted" style="margin-top: var(--space-2);">
              Commencez des cours pour recevoir des recommandations personnalisées.
            </p>
            <a class="btn btn-primary" routerLink="/courses" style="margin-top: var(--space-3);">Explorer les cours</a>
          </app-empty-state>
        }
      }

      <!-- ========================================== -->
      <!-- TAB B: RECOMMANDATIONS DE QUIZ (IA GEMINI) -->
      <!-- ========================================== -->
      @if (activeStudentTab() === 'quizzes') {
        @if (quizLoading()) {
          <div class="state-msg quiz-loading-banner">
            <span class="material-symbols-outlined spin ai-icon">auto_awesome</span>
            <div>
              <strong>Analyse pédagogique Gemini en cours…</strong>
              <div class="text-muted" style="font-size: 0.85rem;">Sélection des quiz les plus adaptés à vos résultats récents.</div>
            </div>
          </div>
        } @else if (quizError()) {
          <div class="state-msg error">
            <span class="material-symbols-outlined">error</span>
            <span>{{ quizError() }}</span>
            <button class="btn" (click)="loadQuizRecommendations(true)">Réessayer</button>
          </div>
        } @else if (quizResponse(); as qr) {
          <!-- Source banner -->
          <div class="quiz-source-banner">
            <div class="source-left">
              <span class="material-symbols-outlined ai-sparkle">
                {{ qr.source === 'gemini' ? 'auto_awesome' : 'smart_toy' }}
              </span>
              <div>
                <span class="source-label">{{ qr.source === 'gemini' ? 'Évaluation formative assistée par Gemini AI' : 'Moteur de règles pédagogiques' }}</span>
                <span class="source-meta">Modèle : {{ qr.modelUsed }}</span>
              </div>
            </div>
            <div class="source-right">
              @if (qr.cached) {
                <span class="cache-pill" title="Réponse servie depuis le cache local pour optimiser la réactivité">
                  <span class="material-symbols-outlined">bolt</span> Instantané
                </span>
              }
              <button class="btn btn-outline btn-sm" (click)="loadQuizRecommendations(true)" title="Forcer une nouvelle analyse Gemini">
                <span class="material-symbols-outlined">refresh</span> Actualiser
              </button>
            </div>
          </div>

          <!-- Pedagogical Summary Card -->
          @if (qr.summary) {
            <div class="summary-card quiz-summary-card">
              <span class="material-symbols-outlined summary-icon">psychology</span>
              <div>
                <div class="summary-title">Diagnostic & Conseil IA</div>
                <p>{{ qr.summary }}</p>
              </div>
            </div>
          }

          <!-- Filters Bar -->
          <div class="quiz-filters-bar">
            <span class="filter-label">Filtrer par objectif :</span>
            @for (opt of quizFilterOptions; track opt.value) {
              <button
                type="button"
                class="btn chip"
                [class.btn-primary]="quizFilter() === opt.value"
                (click)="quizFilter.set(opt.value)">
                {{ opt.label }}
              </button>
            }
          </div>

          <!-- Quizzes Grid -->
          @if (filteredQuizRecs().length) {
            <div class="quiz-grid">
              @for (q of filteredQuizRecs(); track q.quizId) {
                <div
                  class="quiz-card"
                  [class.border-high]="q.priority === 'HIGH'"
                  [class.border-medium]="q.priority === 'MEDIUM'"
                  [class.border-low]="q.priority === 'LOW'">

                  <!-- Top row: Header & Badges -->
                  <div class="qc-top">
                    <div class="qc-header-left">
                      <div class="qc-icon-wrap" [class.icon-needs-imp]="q.status === 'NEEDS_IMPROVEMENT'" [class.icon-review]="q.status === 'REVIEW_SUGGESTED'">
                        <span class="material-symbols-outlined">
                          {{ q.status === 'NEEDS_IMPROVEMENT' ? 'troubleshoot' : (q.status === 'REVIEW_SUGGESTED' ? 'replay' : 'quiz') }}
                        </span>
                      </div>
                      <div>
                        <h3 class="qc-title">{{ q.title }}</h3>
                        <div class="qc-course-pill">
                          <span class="material-symbols-outlined">menu_book</span>
                          <span>{{ q.courseTitle }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="qc-badges-right">
                      <span
                        class="badge"
                        [class.badge-success]="q.difficulty === 'FACILE'"
                        [class.badge-warning]="q.difficulty === 'MOYEN'"
                        [class.badge-danger]="q.difficulty === 'DIFFICILE'">
                        {{ q.difficulty }}
                      </span>
                      <span
                        class="badge"
                        [class.badge-danger]="q.priority === 'HIGH'"
                        [class.badge-warning]="q.priority === 'MEDIUM'"
                        [class.badge-success]="q.priority === 'LOW'">
                        Priorité {{ labelPriority(q.priority) }}
                      </span>
                    </div>
                  </div>

                  <!-- Details Row: Chips & Metrics -->
                  <div class="qc-metrics">
                    <span
                      class="status-chip"
                      [class.chip-danger]="q.status === 'NEEDS_IMPROVEMENT'"
                      [class.chip-primary]="q.status === 'NOT_STARTED'"
                      [class.chip-info]="q.status === 'REVIEW_SUGGESTED'"
                      [class.chip-neutral]="q.status === 'EXPLORATION'">
                      <span class="material-symbols-outlined">
                        {{ q.status === 'NEEDS_IMPROVEMENT' ? 'trending_down' : (q.status === 'NOT_STARTED' ? 'fiber_new' : 'trending_up') }}
                      </span>
                      {{ q.statusLabel }}
                    </span>

                    <span class="meta-item">
                      <span class="material-symbols-outlined">timer</span>
                      {{ q.durationMinutes }} min
                    </span>

                    <span class="meta-item">
                      <span class="material-symbols-outlined">verified</span>
                      Seuil : {{ q.passingScore }}%
                    </span>

                    @if (q.attemptCount > 0) {
                      <span class="meta-item score-history">
                        <span class="material-symbols-outlined">history</span>
                        Dernier score : <strong>{{ q.lastScore }}%</strong>
                        @if (q.bestScore !== null && q.bestScore !== q.lastScore) {
                          <span class="best-score">(Max {{ q.bestScore }}%)</span>
                        }
                      </span>
                    } @else {
                      <span class="meta-item text-muted">
                        <span class="material-symbols-outlined">help_outline</span>
                        Non évalué
                      </span>
                    }
                  </div>

                  <!-- Gemini AI Pedagogical Justification -->
                  <div class="qc-ai-reason">
                    <div class="qc-reason-header">
                      <span class="material-symbols-outlined ai-icon">psychology</span>
                      <strong>Pourquoi ce quiz ? (Conseil IA) :</strong>
                    </div>
                    <p class="qc-reason-body">{{ q.reason }}</p>
                  </div>

                  <!-- Footer Action -->
                  <div class="qc-footer">
                    @if (q.primaryTopic) {
                      <span class="topic-tag">
                        <span class="material-symbols-outlined">label</span>
                        {{ q.primaryTopic }}
                      </span>
                    } @else {
                      <span></span>
                    }

                    <a class="btn btn-primary btn-take-quiz" [routerLink]="'/quizzes/' + q.quizId">
                      <span class="material-symbols-outlined">play_arrow</span>
                      Passer le quiz
                    </a>
                  </div>

                </div>
              }
            </div>
          } @else {
            <app-empty-state message="Aucun quiz dans cette catégorie.">
              <button class="btn btn-primary" (click)="quizFilter.set('ALL')" style="margin-top: var(--space-2);">
                Afficher tous les quiz
              </button>
            </app-empty-state>
          }

        } @else {
          <!-- Empty State -->
          <app-empty-state icon="quiz" message="Aucune recommandation de quiz disponible.">
            <p class="text-muted" style="margin-top: var(--space-2);">
              Passez vos premiers cours et évaluations pour obtenir des suggestions de quiz personnalisées.
            </p>
            <a class="btn btn-primary" routerLink="/courses" style="margin-top: var(--space-3);">Explorer les cours</a>
          </app-empty-state>
        }
      }
    }
  `,
  styles: [`
    .state-msg { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-4); color: var(--color-text-muted); }
    .state-msg.error { color: var(--color-danger); }
    .state-msg .btn { margin-left: var(--space-2); }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Teacher UI Styles */
    .header-actions { display: flex; gap: var(--space-2); align-items: center; }
    .filters-bar { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-4); align-items: center; }
    .search-input { flex: 1 1 260px; padding: 9px 14px; font: inherit; color: var(--color-text); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .filter-pills { display: flex; gap: var(--space-2); }
    .chip { padding: 6px 14px; font-size: 0.85rem; }

    .table-wrap { overflow-x: auto; background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); }
    .crud-table { width: 100%; border-collapse: collapse; text-align: left; }
    .crud-table th, .crud-table td { padding: 12px var(--space-4); border-bottom: 1px solid var(--color-border); vertical-align: middle; }
    .crud-table th { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-muted); background: var(--color-bg); }
    .crud-table tbody tr:last-child td { border-bottom: none; }
    .crud-table tbody tr:hover { background: color-mix(in srgb, var(--color-primary) 3%, transparent); }

    .student-cell { display: flex; flex-direction: column; gap: 2px; }
    .student-name { font-weight: 600; font-size: 0.92rem; }
    .student-email { font-size: 0.8rem; }

    .course-cell { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
    .course-title { font-weight: 600; font-size: 0.92rem; }
    .course-badge { font-size: 0.72rem; }

    .reason-cell { max-width: 320px; }
    .reason-text { margin: 0; font-size: 0.87rem; line-height: 1.4; color: var(--color-text-muted); }

    .date-cell { font-size: 0.82rem; white-space: nowrap; }

    .action-buttons { display: flex; gap: var(--space-2); }
    .btn-sm { padding: 5px 10px; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 4px; }
    .btn-danger-outline { background: transparent; border: 1px solid var(--color-danger); color: var(--color-danger); border-radius: var(--radius-md); cursor: pointer; }
    .btn-danger-outline:hover { background: color-mix(in srgb, var(--color-danger) 10%, transparent); }
    .btn-danger { background: var(--color-danger); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; padding: 8px 16px; }

    /* Modal dialog */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4); }
    .modal-card { background: var(--color-surface); border-radius: var(--radius-lg); width: 100%; max-width: 580px; box-shadow: 0 12px 36px rgba(0,0,0,0.28); border: 1px solid var(--color-border); padding: var(--space-5); animation: pop 0.2s ease-out; max-height: 90vh; overflow-y: auto; }
    .modal-confirm { max-width: 440px; }
    @keyframes pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-3); }
    .modal-header h2 { margin: 0; font-size: 1.2rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .header-icon { color: var(--color-primary); }
    .btn-close { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; border-radius: 4px; }
    .btn-close:hover { background: var(--color-bg); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-4); border-top: 1px solid var(--color-border); padding-top: var(--space-4); }

    .form-field { margin-bottom: var(--space-4); }
    .field-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .form-field label { font-size: 0.87rem; font-weight: 600; }
    .selection-confirmed { font-size: 0.78rem; color: var(--color-success); display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }
    .selection-confirmed .material-symbols-outlined { font-size: 14px; }

    .interactive-input { width: 100%; padding: 10px 14px; font: inherit; border: 1.5px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg); color: var(--color-text); transition: border-color 0.15s; }
    .interactive-input:focus { border-color: var(--color-primary); outline: none; }
    .combobox-wrap { position: relative; }
    .dropdown-panel { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: 0 6px 18px rgba(0,0,0,0.15); max-height: 180px; overflow-y: auto; z-index: 20; }
    .dropdown-item { padding: 9px 12px; cursor: pointer; border-bottom: 1px solid var(--color-border); transition: background 0.15s; }
    .dropdown-item:last-child { border-bottom: none; }
    .dropdown-item:hover { background: color-mix(in srgb, var(--color-primary) 8%, transparent); }
    .item-primary { font-weight: 600; font-size: 0.9rem; }
    .item-secondary { font-size: 0.78rem; margin-top: 2px; }

    .quick-chips { display: flex; align-items: center; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
    .quick-chips-label { font-size: 0.75rem; color: var(--color-text-muted); }
    .quick-chip { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 2px 8px; font-size: 0.75rem; cursor: pointer; color: var(--color-text); }
    .quick-chip:hover, .chip-active { background: color-mix(in srgb, var(--color-primary) 15%, transparent); border-color: var(--color-primary); color: var(--color-primary); }

    .select-fallback { margin-top: 6px; }
    .secondary-select { width: 100%; padding: 6px 10px; font-size: 0.8rem; border: 1px dashed var(--color-border); border-radius: var(--radius-md); background: transparent; color: var(--color-text-muted); cursor: pointer; }

    .priority-selector { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .priority-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 8px; border: 1.5px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg); cursor: pointer; transition: all 0.15s; color: var(--color-text); }
    .priority-card .material-symbols-outlined { font-size: 20px; }
    .priority-card .prio-text { font-size: 0.82rem; font-weight: 600; }
    .priority-card:hover { transform: translateY(-1px); }
    .prio-high.active { border-color: #ef4444; background: rgba(239, 68, 68, 0.12); color: #dc2626; }
    .prio-med.active { border-color: #f59e0b; background: rgba(245, 158, 11, 0.12); color: #d97706; }
    .prio-low.active { border-color: #10b981; background: rgba(16, 185, 129, 0.12); color: #059669; }

    .template-chips { display: flex; align-items: center; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
    .template-chip { background: var(--color-bg); border: 1px dashed var(--color-border); border-radius: 6px; padding: 3px 8px; font-size: 0.75rem; cursor: pointer; color: var(--color-text-muted); }
    .template-chip:hover { border-color: var(--color-primary); color: var(--color-primary); }

    .form-field textarea { width: 100%; padding: 10px 12px; font: inherit; border: 1.5px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg); color: var(--color-text); resize: vertical; }
    .form-field textarea:focus { border-color: var(--color-primary); outline: none; }
    .required { color: var(--color-danger); }

    .alert { padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-4); font-size: 0.9rem; display: flex; align-items: center; gap: 8px; }
    .alert-success { background: color-mix(in srgb, var(--color-success) 12%, transparent); color: var(--color-success); border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent); }
    .alert-danger { background: color-mix(in srgb, var(--color-danger) 12%, transparent); color: var(--color-danger); border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent); }

    /* Student View Styles */
    .source-row { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-3); font-size: 0.85rem; }
    .ai-icon { color: var(--color-primary); }
    .fallback-icon { color: var(--color-text-muted); }
    .source-label { font-weight: 600; }
    .source-model { font-size: 0.78rem; }
    .summary-card { display: flex; gap: var(--space-3); align-items: flex-start; padding: var(--space-4); background: var(--color-primary-soft); border-radius: var(--radius-md); margin-bottom: var(--space-4);
      .material-symbols-outlined { color: var(--color-primary); font-size: 24px; }
      p { margin: 0; font-size: 0.95rem; line-height: 1.5; } }
    .filters { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); }
    .list { display: grid; gap: var(--space-3); }
    .row { display: flex; align-items: center; gap: var(--space-4); }
    .icon { padding: 10px; color: var(--color-primary); background: var(--color-primary-soft); border-radius: var(--radius-md); }
    .icon-teacher { color: #f59e0b; background: rgba(245, 158, 11, 0.15); }
    .card-teacher { border-left: 4px solid #f59e0b; }
    .badge-teacher { background: rgba(245, 158, 11, 0.15); color: #b45309; display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }
    .body { flex: 1; min-width: 0; }
    .tags { display: flex; gap: var(--space-2); margin-bottom: var(--space-2); flex-wrap: wrap; }
    h3 { margin-bottom: var(--space-1); font-size: 1rem; }
    .reason { margin: 0; font-size: 0.87rem; display: flex; align-items: flex-start; gap: 4px;
      .material-symbols-outlined { font-size: 15px; flex-shrink: 0; margin-top: 2px; } }
    /* Category Navigation Tabs */
    .category-tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); border-bottom: 2px solid var(--color-border); padding-bottom: 2px; }
    .cat-tab { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border: none; background: transparent; color: var(--color-text-muted); font-size: 0.95rem; font-weight: 600; cursor: pointer; border-radius: var(--radius-md) var(--radius-md) 0 0; position: relative; transition: all 0.2s; }
    .cat-tab:hover { color: var(--color-text); background: color-mix(in srgb, var(--color-primary) 5%, transparent); }
    .cat-tab-active { color: var(--color-primary) !important; background: color-mix(in srgb, var(--color-primary) 10%, transparent); }
    .cat-tab-active::after { content: ''; position: absolute; bottom: -4px; left: 0; right: 0; height: 3px; background: var(--color-primary); border-radius: 3px; }
    .cat-pill { background: var(--color-bg); color: var(--color-text-muted); font-size: 0.75rem; padding: 2px 7px; border-radius: 10px; font-weight: 700; }
    .cat-tab-active .cat-pill { background: var(--color-primary); color: white; }
    .cat-tab-ai .ai-sparkle { color: #8b5cf6; }
    .cat-tab-ai.cat-tab-active { color: #7c3aed !important; }
    .cat-tab-ai.cat-tab-active::after { background: #7c3aed; }
    .cat-pill-ai { background: rgba(139, 92, 246, 0.15); color: #7c3aed; }
    .cat-tab-ai.cat-tab-active .cat-pill-ai { background: #7c3aed; color: white; }

    /* Quiz AI Recommendations Styles */
    .quiz-source-banner { display: flex; justify-content: space-between; align-items: center; padding: 12px var(--space-4); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); margin-bottom: var(--space-4); flex-wrap: wrap; gap: var(--space-3); }
    .source-left { display: flex; align-items: center; gap: var(--space-3); }
    .ai-sparkle { color: #8b5cf6; font-size: 24px; animation: pulse 2s infinite ease-in-out; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.75; transform: scale(1.1); } }
    .source-meta { display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-top: 2px; }
    .source-right { display: flex; align-items: center; gap: var(--space-2); }
    .cache-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #059669; background: rgba(16, 185, 129, 0.12); padding: 3px 8px; border-radius: 12px; font-weight: 600; }
    .cache-pill .material-symbols-outlined { font-size: 14px; }

    .quiz-summary-card { background: color-mix(in srgb, #8b5cf6 10%, var(--color-surface)); border: 1px solid color-mix(in srgb, #8b5cf6 25%, transparent); }
    .quiz-summary-card .summary-icon { color: #7c3aed; font-size: 28px; }
    .summary-title { font-weight: 700; font-size: 0.88rem; color: #7c3aed; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.03em; }

    .quiz-filters-bar { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-4); flex-wrap: wrap; }
    .filter-label { font-size: 0.83rem; font-weight: 600; color: var(--color-text-muted); margin-right: 4px; }

    .quiz-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: var(--space-4); }
    .quiz-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: transform 0.2s, box-shadow 0.2s; }
    .quiz-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
    .border-high { border-left: 4px solid #ef4444; }
    .border-medium { border-left: 4px solid #f59e0b; }
    .border-low { border-left: 4px solid #10b981; }

    .qc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-3); }
    .qc-header-left { display: flex; gap: var(--space-3); align-items: flex-start; }
    .qc-icon-wrap { width: 40px; height: 40px; border-radius: var(--radius-md); background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .icon-needs-imp { background: rgba(239, 68, 68, 0.12); color: #dc2626; }
    .icon-review { background: rgba(139, 92, 246, 0.12); color: #7c3aed; }
    .qc-title { font-size: 1.02rem; font-weight: 700; margin: 0 0 4px 0; line-height: 1.3; }
    .qc-course-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 0.78rem; color: var(--color-text-muted); background: var(--color-bg); padding: 2px 8px; border-radius: 4px; }
    .qc-course-pill .material-symbols-outlined { font-size: 13px; }
    .qc-badges-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }

    .qc-metrics { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 8px 10px; background: var(--color-bg); border-radius: var(--radius-md); font-size: 0.8rem; }
    .status-chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; font-size: 0.76rem; font-weight: 700; }
    .chip-danger { background: rgba(239, 68, 68, 0.14); color: #dc2626; }
    .chip-primary { background: rgba(59, 130, 246, 0.14); color: #2563eb; }
    .chip-info { background: rgba(139, 92, 246, 0.14); color: #7c3aed; }
    .chip-neutral { background: rgba(107, 114, 128, 0.14); color: var(--color-text-muted); }
    .meta-item { display: inline-flex; align-items: center; gap: 4px; color: var(--color-text-muted); }
    .meta-item .material-symbols-outlined { font-size: 15px; }
    .score-history { color: var(--color-text); font-weight: 500; }
    .best-score { color: var(--color-text-muted); font-size: 0.74rem; }

    .qc-ai-reason { background: color-mix(in srgb, #8b5cf6 6%, transparent); border: 1px dashed color-mix(in srgb, #8b5cf6 25%, transparent); border-radius: var(--radius-md); padding: 10px 12px; }
    .qc-reason-header { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #7c3aed; margin-bottom: 4px; }
    .qc-reason-header .ai-icon { font-size: 16px; color: #7c3aed; }
    .qc-reason-body { margin: 0; font-size: 0.88rem; line-height: 1.45; color: var(--color-text); }

    .qc-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: var(--space-2); }
    .topic-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 0.78rem; color: var(--color-text-muted); }
    .topic-tag .material-symbols-outlined { font-size: 14px; }
    .btn-take-quiz { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; padding: 7px 16px; }

    .quiz-loading-banner { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-5); background: color-mix(in srgb, #8b5cf6 8%, transparent); border-radius: var(--radius-lg); border: 1px dashed color-mix(in srgb, #8b5cf6 30%, transparent); }
    @media (max-width: 600px) { .row { flex-wrap: wrap; } .quiz-grid { grid-template-columns: 1fr; } }
  `]
})
export class RecommendationsPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly recService = inject(RecommendationApiService);
  private readonly teacherRecService = inject(TeacherRecommendationService);

  protected readonly user = this.auth.user;
  protected readonly isTeacherOrAdmin = computed(() => {
    const role = this.user()?.role;
    return role === 'TEACHER' || role === 'ADMIN';
  });

  // ---- Student State ----
  protected readonly activeStudentTab = signal<'courses' | 'quizzes'>('courses');

  // Courses state
  protected readonly studentLoading = signal(false);
  protected readonly studentError = signal<string | null>(null);
  protected readonly studentResponse = signal<RecommendationResponse | null>(null);
  protected readonly typeFilter = signal<FilterType>('Toutes');
  protected readonly filterTypes: FilterType[] = ['Toutes', 'COURSE', 'QUIZ'];

  // AI Quiz Recommendations state
  protected readonly quizLoading = signal(false);
  protected readonly quizError = signal<string | null>(null);
  protected readonly quizResponse = signal<QuizRecommendationResponse | null>(null);
  protected readonly quizFilter = signal<string>('ALL');
  protected readonly quizFilterOptions = [
    { label: 'Tous les quiz', value: 'ALL' },
    { label: 'À améliorer', value: 'NEEDS_IMPROVEMENT' },
    { label: 'Non commencés', value: 'NOT_STARTED' },
    { label: 'Révisions suggérées', value: 'REVIEW_SUGGESTED' }
  ];

  protected readonly filteredQuizRecs = computed<QuizRecommendationItem[]>(() => {
    const resp = this.quizResponse();
    if (!resp) return [];
    const f = this.quizFilter();
    if (f === 'ALL') return resp.recommendations;
    if (f === 'NOT_STARTED') {
      return resp.recommendations.filter(q => q.status === 'NOT_STARTED' || q.status === 'EXPLORATION');
    }
    return resp.recommendations.filter(q => q.status === f);
  });

  // ---- Teacher State ----
  protected readonly teacherLoading = signal(false);
  protected readonly teacherError = signal<string | null>(null);
  protected readonly actionSuccess = signal<string | null>(null);
  protected readonly teacherRecs = signal<TeacherRecommendation[]>([]);
  protected readonly studentsList = signal<StudentOption[]>([]);
  protected readonly coursesList = signal<CourseOption[]>([]);

  protected readonly searchQuery = signal('');
  protected readonly selectedPriority = signal('ALL');
  protected readonly priorityFilters = [
    { label: 'Toutes', value: 'ALL' },
    { label: 'Haute', value: 'HIGH' },
    { label: 'Moyenne', value: 'MEDIUM' },
    { label: 'Basse', value: 'LOW' }
  ];

  // Modal State
  protected readonly showModal = signal(false);
  protected readonly modalEditMode = signal(false);
  protected readonly modalSaving = signal(false);
  protected readonly modalError = signal<string | null>(null);
  protected editingId: number | null = null;

  // Form Fields
  protected formStudentId: number | null = null;
  protected formStudentEmail = '';
  protected formCourseId: number | null = null;
  protected formCourseTitle = '';
  protected formPriority: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  protected formReason = '';

  // Interactive Search States
  protected readonly studentSearchText = signal('');
  protected readonly showStudentSuggestions = signal(false);
  protected readonly selectedStudent = signal<StudentOption | null>(null);

  protected readonly courseSearchText = signal('');
  protected readonly showCourseSuggestions = signal(false);
  protected readonly selectedCourse = signal<CourseOption | null>(null);

  // Delete State
  protected readonly deletingRec = signal<TeacherRecommendation | null>(null);
  protected readonly deleteInProgress = signal(false);

  // Filtered Students for combobox
  protected readonly filteredStudents = computed<StudentOption[]>(() => {
    const q = this.studentSearchText().trim().toLowerCase();
    const list = this.studentsList();
    if (!q) return list;
    return list.filter(s =>
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  // Filtered Courses for combobox
  protected readonly filteredCourses = computed<CourseOption[]>(() => {
    const q = this.courseSearchText().trim().toLowerCase();
    const list = this.coursesList();
    if (!q) return list;
    return list.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.subject && c.subject.toLowerCase().includes(q))
    );
  });

  // Computed Filters for Teacher Table
  protected readonly filteredTeacherRecs = computed<TeacherRecommendation[]>(() => {
    let list = this.teacherRecs();
    const q = this.searchQuery().trim().toLowerCase();
    const prio = this.selectedPriority();

    if (prio !== 'ALL') {
      list = list.filter(r => r.priority === prio);
    }

    if (q) {
      list = list.filter(r =>
        r.studentName.toLowerCase().includes(q) ||
        r.studentEmail.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
      );
    }
    return list;
  });

  // Computed Filters for Student
  protected readonly filteredStudentRecs = computed<RecommendationItem[]>(() => {
    const r = this.studentResponse();
    if (!r) return [];
    const f = this.typeFilter();
    return f === 'Toutes' ? r.recommendations : r.recommendations.filter(x => x.type === f);
  });

  ngOnInit(): void {
    if (this.isTeacherOrAdmin()) {
      this.loadTeacherRecommendations();
      this.loadOptions();
    } else {
      this.loadStudentRecommendations();
      this.loadQuizRecommendations(false);
    }
  }

  // ---- Teacher Actions ----
  protected loadTeacherRecommendations(): void {
    this.teacherLoading.set(true);
    this.teacherError.set(null);

    this.teacherRecService.list().subscribe({
      next: recs => {
        this.teacherRecs.set(recs);
        this.teacherLoading.set(false);
      },
      error: (err: any) => {
        this.teacherLoading.set(false);
        console.error('Erreur chargement recommandations enseignant:', err);
        this.teacherError.set('Impossible de charger les recommandations.');
      }
    });
  }

  protected loadOptions(): void {
    this.teacherRecService.getStudents().subscribe({
      next: students => {
        this.studentsList.set(students);
      },
      error: err => console.error('Erreur chargement étudiants:', err)
    });

    this.teacherRecService.getCourses().subscribe({
      next: courses => {
        this.coursesList.set(courses);
      },
      error: err => console.error('Erreur chargement cours:', err)
    });
  }

  protected openCreateModal(): void {
    this.modalEditMode.set(false);
    this.editingId = null;
    this.formStudentId = null;
    this.formStudentEmail = '';
    this.formCourseId = null;
    this.formCourseTitle = '';
    this.formPriority = 'HIGH';
    this.formReason = '';
    this.studentSearchText.set('');
    this.courseSearchText.set('');
    this.selectedStudent.set(null);
    this.selectedCourse.set(null);
    this.modalError.set(null);
    this.showModal.set(true);

    if (!this.studentsList().length || !this.coursesList().length) {
      this.loadOptions();
    }
  }

  protected openEditModal(rec: TeacherRecommendation): void {
    this.modalEditMode.set(true);
    this.editingId = rec.id;
    this.formStudentId = rec.studentId;
    this.formStudentEmail = rec.studentEmail;
    this.formCourseId = rec.courseId;
    this.formCourseTitle = rec.courseTitle;
    this.formPriority = rec.priority || 'HIGH';
    this.formReason = rec.reason;

    this.studentSearchText.set(`${rec.studentName} (${rec.studentEmail})`);
    this.courseSearchText.set(rec.courseTitle);
    this.selectedStudent.set({
      id: rec.studentId,
      firstName: rec.studentName,
      lastName: '',
      email: rec.studentEmail,
      role: 'STUDENT'
    });
    this.selectedCourse.set({
      id: rec.courseId,
      title: rec.courseTitle,
      subject: rec.courseSubject
    });

    this.modalError.set(null);
    this.showModal.set(true);

    if (!this.studentsList().length || !this.coursesList().length) {
      this.loadOptions();
    }
  }

  protected closeModal(): void {
    if (!this.modalSaving()) {
      this.showModal.set(false);
      this.showStudentSuggestions.set(false);
      this.showCourseSuggestions.set(false);
    }
  }

  // Combobox Student handling
  protected onStudentSearchInput(val: string): void {
    this.studentSearchText.set(val);
    this.showStudentSuggestions.set(true);

    // Try finding exact match by email
    const match = this.studentsList().find(s => s.email.toLowerCase() === val.trim().toLowerCase());
    if (match) {
      this.selectStudent(match);
    } else {
      this.formStudentEmail = val.trim();
      this.selectedStudent.set(null);
    }
  }

  protected selectStudent(s: StudentOption): void {
    this.formStudentId = s.id;
    this.formStudentEmail = s.email;
    this.selectedStudent.set(s);
    this.studentSearchText.set(`${s.lastName} ${s.firstName} (${s.email})`);
    this.showStudentSuggestions.set(false);
  }

  // Combobox Course handling
  protected onCourseSearchInput(val: string): void {
    this.courseSearchText.set(val);
    this.showCourseSuggestions.set(true);

    const match = this.coursesList().find(c => c.title.toLowerCase() === val.trim().toLowerCase());
    if (match) {
      this.selectCourse(match);
    } else {
      this.formCourseTitle = val.trim();
      this.selectedCourse.set(null);
    }
  }

  protected selectCourse(c: CourseOption): void {
    this.formCourseId = c.id;
    this.formCourseTitle = c.title;
    this.selectedCourse.set(c);
    this.courseSearchText.set(c.title);
    this.showCourseSuggestions.set(false);
  }

  protected onSelectCourseChange(courseId: number | null): void {
    if (!courseId) return;
    const found = this.coursesList().find(c => c.id === courseId);
    if (found) {
      this.selectCourse(found);
    }
  }

  protected applyTemplate(text: string): void {
    this.formReason = text;
  }

  protected isFormValid(): boolean {
    const hasStudent = !!this.formStudentId || !!this.formStudentEmail.trim();
    const hasCourse = !!this.formCourseId || !!this.formCourseTitle.trim();
    const hasReason = !!this.formReason.trim();
    return hasStudent && hasCourse && hasReason;
  }

  protected saveRecommendation(): void {
    if (!this.isFormValid()) {
      this.modalError.set('Veuillez renseigner un étudiant, un cours et un motif.');
      return;
    }

    this.modalSaving.set(true);
    this.modalError.set(null);

    const studentName = this.selectedStudent()
      ? `${this.selectedStudent()!.firstName} ${this.selectedStudent()!.lastName}`.trim()
      : (this.studentSearchText() || 'Étudiant');

    const courseTitle = this.selectedCourse()
      ? this.selectedCourse()!.title
      : (this.courseSearchText() || 'Cours');

    const payload = {
      studentId: this.formStudentId,
      studentEmail: this.formStudentEmail || this.studentSearchText().trim(),
      courseId: this.formCourseId,
      courseTitle: courseTitle,
      priority: this.formPriority,
      reason: this.formReason.trim()
    };

    if (this.modalEditMode() && this.editingId) {
      this.teacherRecService.update(this.editingId, payload).subscribe({
        next: updated => {
          this.teacherRecs.update(list => list.map(item => item.id === updated.id ? {
            ...updated,
            studentName: studentName || updated.studentName,
            courseTitle: courseTitle || updated.courseTitle
          } : item));
          this.modalSaving.set(false);
          this.showModal.set(false);
          this.showSuccessNotification('Recommandation mise à jour avec succès.');
        },
        error: (err: any) => {
          this.modalSaving.set(false);
          this.modalError.set(err.error?.message || 'Erreur lors de la mise à jour.');
        }
      });
    } else {
      this.teacherRecService.create(payload).subscribe({
        next: created => {
          const formatted = {
            ...created,
            studentName: studentName || created.studentName,
            courseTitle: courseTitle || created.courseTitle
          };
          this.teacherRecs.update(list => [formatted, ...list]);
          this.modalSaving.set(false);
          this.showModal.set(false);
          this.showSuccessNotification('Recommandation attribuée à l\'étudiant avec succès !');
        },
        error: (err: any) => {
          this.modalSaving.set(false);
          this.modalError.set(err.error?.message || 'Erreur lors de la création.');
        }
      });
    }
  }

  protected confirmDelete(rec: TeacherRecommendation): void {
    this.deletingRec.set(rec);
  }

  protected cancelDelete(): void {
    if (!this.deleteInProgress()) {
      this.deletingRec.set(null);
    }
  }

  protected executeDelete(id: number): void {
    this.deleteInProgress.set(true);
    this.teacherRecService.delete(id).subscribe({
      next: () => {
        this.teacherRecs.update(list => list.filter(r => r.id !== id));
        this.deleteInProgress.set(false);
        this.deletingRec.set(null);
        this.showSuccessNotification('Recommandation supprimée.');
      },
      error: (err: any) => {
        this.deleteInProgress.set(false);
        console.error('Erreur lors de la suppression:', err);
        alert(err.error?.message || 'Impossible de supprimer cette recommandation.');
      }
    });
  }

  private showSuccessNotification(msg: string): void {
    this.actionSuccess.set(msg);
    setTimeout(() => this.actionSuccess.set(null), 4000);
  }

  // ---- Student Actions ----
  protected loadStudentRecommendations(): void {
    this.studentLoading.set(true);
    this.studentError.set(null);

    this.recService.getRecommendations().subscribe({
      next: data => {
        this.studentResponse.set(data);
        this.studentLoading.set(false);
      },
      error: (err: any) => {
        this.studentLoading.set(false);
        console.error('Erreur chargement recommandations:', err);
        if (err.status === 0) {
          this.studentError.set('Impossible de contacter le serveur. Vérifiez que le backend (port 8082) est démarré.');
        } else if (err.status === 500) {
          this.studentError.set('Erreur serveur (500) : la base de données MySQL est inaccessible.');
        } else if (err.status === 400 && err.error?.message) {
          this.studentError.set(err.error.message);
        } else if (err.error?.message) {
          this.studentError.set(err.error.message);
        } else {
          this.studentError.set('Impossible de générer les recommandations.');
        }
      },
    });
  }

  protected setStudentTab(tab: 'courses' | 'quizzes'): void {
    this.activeStudentTab.set(tab);
    if (tab === 'quizzes' && !this.quizResponse() && !this.quizLoading()) {
      this.loadQuizRecommendations(false);
    }
  }

  protected loadQuizRecommendations(refresh = false): void {
    this.quizLoading.set(true);
    this.quizError.set(null);

    this.recService.getQuizRecommendations(refresh).subscribe({
      next: data => {
        this.quizResponse.set(data);
        this.quizLoading.set(false);
      },
      error: (err: any) => {
        this.quizLoading.set(false);
        console.error('Erreur chargement recommandations quiz:', err);
        if (err.status === 0) {
          this.quizError.set('Impossible de contacter le serveur (port 8082). Vérifiez que le backend est démarré.');
        } else if (err.error?.message) {
          this.quizError.set(err.error.message);
        } else {
          this.quizError.set('Impossible de générer les recommandations de quiz par IA.');
        }
      }
    });
  }

  protected isTeacherAssigned(item: RecommendationItem): boolean {
    return item.reason.includes('Recommandé par');
  }

  protected actionLink(item: RecommendationItem): string {
    if (item.action === 'START_QUIZ') return `/quizzes/${item.resourceId}`;
    return `/courses/${item.resourceId}`;
  }

  protected iconFor(type: string): string {
    if (type === 'COURSE') return 'menu_book';
    if (type === 'QUIZ') return 'quiz';
    return 'lightbulb';
  }

  protected labelType(type: string): string {
    if (type === 'COURSE') return 'Cours';
    if (type === 'QUIZ') return 'Quiz';
    return type;
  }

  protected labelPriority(p: string): string {
    if (p === 'HIGH') return 'haute';
    if (p === 'MEDIUM') return 'moyenne';
    return 'basse';
  }

  protected formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}

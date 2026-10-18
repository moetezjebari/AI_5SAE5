import { Routes } from '@angular/router';

export const QUIZZES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/quizzes-page').then(m => m.QuizzesPage) },
  { path: 'create', loadComponent: () => import('./pages/quiz-edit-page').then(m => m.QuizEditPage) },
  { path: ':id/edit', loadComponent: () => import('./pages/quiz-edit-page').then(m => m.QuizEditPage) },
  { path: 'generate', loadComponent: () => import('./pages/quiz-generator-page').then(m => m.QuizGeneratorPage) },
  { path: ':id', loadComponent: () => import('./pages/quiz-take-page').then(m => m.QuizTakePage) }
];

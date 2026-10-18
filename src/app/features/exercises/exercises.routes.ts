import { Routes } from '@angular/router';

export const EXERCISES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/exercises-page').then(m => m.ExercisesPage) },
  { path: ':id', loadComponent: () => import('./pages/exercise-detail-page').then(m => m.ExerciseDetailPage) }
];

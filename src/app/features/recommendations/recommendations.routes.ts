import { Routes } from '@angular/router';

export const RECOMMENDATIONS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/recommendations-page').then(m => m.RecommendationsPage) }
];

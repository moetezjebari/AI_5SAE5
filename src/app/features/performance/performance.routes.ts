import { Routes } from '@angular/router';

export const PERFORMANCE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/performance-page').then(m => m.PerformancePage) }
];

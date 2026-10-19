import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayout } from './layouts/main-layout/main-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayout,
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES) },
      { path: 'profile', loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES) },
      { path: 'assistant', loadChildren: () => import('./features/assistant/assistant.routes').then(m => m.ASSISTANT_ROUTES) },
      { path: 'courses', loadChildren: () => import('./features/courses/courses.routes').then(m => m.COURSES_ROUTES) },
      { path: 'exercises', loadChildren: () => import('./features/exercises/exercises.routes').then(m => m.EXERCISES_ROUTES) },
      { path: 'quizzes', loadChildren: () => import('./features/quizzes/quizzes.routes').then(m => m.QUIZZES_ROUTES) },
      { path: 'performance', loadChildren: () => import('./features/performance/performance.routes').then(m => m.PERFORMANCE_ROUTES) },
      { path: 'recommendations', loadChildren: () => import('./features/recommendations/recommendations.routes').then(m => m.RECOMMENDATIONS_ROUTES) },
      { path: 'admin', loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  { path: '**', redirectTo: '' }
];

import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: 'login', loadComponent: () => import('./pages/auth-page').then(m => m.AuthPage) },
  { path: 'register', loadComponent: () => import('./pages/register-page').then(m => m.RegisterPage) },
  { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password-page').then(m => m.ForgotPasswordPage) },
  { path: '', pathMatch: 'full', redirectTo: 'login' }
];

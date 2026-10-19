import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'users',
    canActivate: [roleGuard('ADMIN')],
    loadComponent: () => import('./pages/admin-users-page').then(m => m.AdminUsersPage)
  }
];

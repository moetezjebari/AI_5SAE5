import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/user.model';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? true : inject(Router).createUrlTree(['/auth/login']);
};

/** Confort d'interface uniquement : les autorisations réelles sont appliquées par le backend. */
export const roleGuard = (...roles: Role[]): CanActivateFn => () => {
  const user = inject(AuthService).user();
  return user && roles.includes(user.role) ? true : inject(Router).createUrlTree(['/dashboard']);
};

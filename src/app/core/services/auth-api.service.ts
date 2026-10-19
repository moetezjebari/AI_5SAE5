import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { ApiAuthResponse } from '../models/api.model';
import { API_BASE_URL } from '../config';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  login(email: string, password: string): Observable<ApiAuthResponse> {
    return this.http.post<ApiAuthResponse>(`${API_BASE_URL}/auth/login`, { email, password }).pipe(
      tap(res => this.authService.setSession(res.token, res.user))
    );
  }

  register(firstName: string, lastName: string, email: string, password: string, role: 'STUDENT' | 'TEACHER' = 'STUDENT'): Observable<ApiAuthResponse> {
    return this.http.post<ApiAuthResponse>(`${API_BASE_URL}/auth/register`, { firstName, lastName, email, password, role }).pipe(
      tap(res => this.authService.setSession(res.token, res.user))
    );
  }

  getMe(): Observable<import('../models/user.model').User> {
    // Profil détaillé (photo, filière, niveau, activité) : /users/me est un sur-ensemble de /auth/me.
    return this.http.get<import('../models/user.model').User>(`${API_BASE_URL}/users/me`).pipe(
      tap(user => this.authService.updateUser(user))
    );
  }

  updateProfile(firstName: string, lastName: string, email: string, field?: string, level?: string): Observable<import('../models/user.model').User> {
    return this.http.put<import('../models/user.model').User>(`${API_BASE_URL}/auth/profile`, { firstName, lastName, email, field, level }).pipe(
      tap(user => this.authService.updateUser(user))
    );
  }

  setAvatar(dataUrl: string | null): Observable<import('../models/user.model').User> {
    const req = dataUrl
      ? this.http.put<import('../models/user.model').User>(`${API_BASE_URL}/users/me/avatar`, { dataUrl })
      : this.http.delete<import('../models/user.model').User>(`${API_BASE_URL}/users/me/avatar`);
    return req.pipe(tap(user => this.authService.updateUser(user)));
  }

  /** Invalide le jeton côté serveur (au mieux) puis nettoie la session locale. */
  logout(): Observable<void> {
    const call = this.authService.token ? this.http.post<void>(`${API_BASE_URL}/auth/logout`, {}) : of(undefined);
    return call.pipe(
      catchError(() => of(undefined)),
      map(() => undefined),
      finalize(() => this.authService.logout())
    );
  }

  changePassword(current: string, next: string): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/auth/password`, { current, next });
  }
}

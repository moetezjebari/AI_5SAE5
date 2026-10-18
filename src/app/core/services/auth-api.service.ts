import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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

  register(firstName: string, lastName: string, email: string, password: string): Observable<ApiAuthResponse> {
    return this.http.post<ApiAuthResponse>(`${API_BASE_URL}/auth/register`, { firstName, lastName, email, password }).pipe(
      tap(res => this.authService.setSession(res.token, res.user))
    );
  }

  getMe(): Observable<import('../models/user.model').User> {
    return this.http.get<import('../models/user.model').User>(`${API_BASE_URL}/auth/me`).pipe(
      tap(user => this.authService.updateUser(user))
    );
  }

  updateProfile(firstName: string, lastName: string, email: string): Observable<import('../models/user.model').User> {
    return this.http.put<import('../models/user.model').User>(`${API_BASE_URL}/auth/profile`, { firstName, lastName, email }).pipe(
      tap(user => this.authService.updateUser(user))
    );
  }

  changePassword(current: string, next: string): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/auth/password`, { current, next });
  }
}

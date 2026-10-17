import { Injectable, computed, signal } from '@angular/core';
import { User } from '../models/user.model';

const TOKEN_KEY = 'lms_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null || !!this.token);

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    this._user.set(user);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._user.set(null);
  }
}

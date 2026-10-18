import { Injectable, computed, signal } from '@angular/core';
import { User } from '../models/user.model';

const TOKEN_KEY = 'lms_token';
const USER_KEY = 'lms_user';

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload['exp'] !== 'number') return true;
  return payload['exp'] * 1000 < Date.now();
}

function userFromToken(token: string): User | null {
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  // Backend encodes: sub=email, role, userId, firstName, lastName
  const role = payload['role'] as string;
  const id = payload['userId'] as number;
  const sub = payload['sub'] as string;
  const firstName = (payload['firstName'] as string) || '';
  const lastName = (payload['lastName'] as string) || '';
  if (!role || !id || !sub) return null;
  return { id, email: sub, firstName, lastName, role: role as User['role'] };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(this.restoreUser());
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user() || !!this.validToken);

  private get validToken(): string | null {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t || isTokenExpired(t)) return null;
    return t;
  }

  get token(): string | null {
    return this.validToken;
  }

  private restoreUser(): User | null {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t || isTokenExpired(t)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        const u = JSON.parse(saved) as User;
        if (u && u.id && u.email) return u;
      } catch {
        // Fall back to token
      }
    }
    return userFromToken(t);
  }

  setSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  updateUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }
}

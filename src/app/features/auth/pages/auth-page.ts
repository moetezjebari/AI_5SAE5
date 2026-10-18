import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { Card } from '../../../shared/components/card';

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink, Card],
  template: `
    <app-card class="login-card">
      <h2>Connexion</h2>
      <p class="text-muted">Accédez à votre espace d'apprentissage.</p>

      @if (error()) {
        <div class="alert-error">
          <span class="material-symbols-outlined">error</span> {{ error() }}
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-field">
          <label for="email">Adresse e-mail</label>
          <input id="email" type="email" formControlName="email" placeholder="vous@exemple.com" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="error">Adresse e-mail valide requise.</span>
          }
        </div>
        <div class="form-field">
          <label for="password">Mot de passe</label>
          <input id="password" type="password" formControlName="password" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="error">6 caractères minimum.</span>
          }
        </div>
        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          <span class="material-symbols-outlined" [class.spin]="loading()">
            {{ loading() ? 'progress_activity' : 'login' }}
          </span>
          {{ loading() ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>

      <div class="demo-hint">
        <strong>Comptes de démonstration :</strong><br/>
        student&#64;lms.local / Student123! &nbsp;·&nbsp; teacher&#64;lms.local / Teacher123! &nbsp;·&nbsp; admin&#64;lms.local / Admin123!
      </div>

      <p class="links">
        <a routerLink="/auth/forgot-password">Mot de passe oublié ?</a>
        <a routerLink="/auth/register">Créer un compte</a>
      </p>
    </app-card>
  `,
  styles: [`
    .login-card { width: min(100%, 420px); }
    .alert-error { display: flex; align-items: center; gap: var(--space-2); padding: 10px var(--space-3);
      background: color-mix(in srgb, var(--color-danger) 12%, transparent); color: var(--color-danger);
      border-radius: var(--radius-md); margin-bottom: var(--space-3); font-size: 0.9rem; }
    .demo-hint { margin: var(--space-4) 0; padding: var(--space-3); background: var(--color-bg);
      border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.8rem;
      color: var(--color-text-muted); line-height: 1.6; }
    .links { display: flex; justify-content: space-between; margin: var(--space-4) 0 0; font-size: 0.9rem; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AuthPage {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.authApi.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.error.set(err.status === 401 ? 'Email ou mot de passe incorrect.' : 'Erreur de connexion. Vérifiez que le backend est démarré.');
        this.loading.set(false);
      }
    });
  }
}

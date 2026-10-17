import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Card } from '../../../shared/components/card';

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink, Card],
  template: `
    <app-card class="login-card">
      <h2>Connexion</h2>
      <p class="text-muted">Accédez à votre espace d'apprentissage.</p>
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
        <button class="btn btn-primary btn-block" type="submit">Se connecter</button>
      </form>
      <p class="links">
        <a routerLink="/auth/forgot-password">Mot de passe oublié ?</a>
        <a routerLink="/auth/register">Créer un compte</a>
      </p>
    </app-card>
  `,
  styles: [`
    .login-card { width: min(100%, 400px); }
    .links { display: flex; justify-content: space-between; margin: var(--space-4) 0 0; font-size: 0.9rem; }
  `]
})
export class AuthPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Provisoire (aperçu du design) : session fictive, remplacée par la vraie authentification en Phase 4.
    this.auth.setSession('demo-token', {
      id: 0,
      email: this.form.getRawValue().email,
      firstName: 'Étudiant',
      lastName: 'Démo',
      role: 'STUDENT'
    });
    this.router.navigate(['/dashboard']);
  }
}

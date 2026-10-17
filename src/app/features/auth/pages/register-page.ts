import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Card } from '../../../shared/components/card';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  return group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, Card],
  template: `
    <app-card class="auth-card">
      <h2>Créer un compte</h2>
      <p class="text-muted">Rejoignez la plateforme en quelques secondes.</p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="two">
          <div class="form-field">
            <label for="fn">Prénom</label>
            <input id="fn" formControlName="firstName" />
            @if (form.controls.firstName.touched && form.controls.firstName.invalid) { <span class="error">Requis.</span> }
          </div>
          <div class="form-field">
            <label for="ln">Nom</label>
            <input id="ln" formControlName="lastName" />
            @if (form.controls.lastName.touched && form.controls.lastName.invalid) { <span class="error">Requis.</span> }
          </div>
        </div>
        <div class="form-field">
          <label for="em">Adresse e-mail</label>
          <input id="em" type="email" formControlName="email" />
          @if (form.controls.email.touched && form.controls.email.invalid) { <span class="error">E-mail valide requis.</span> }
        </div>
        <div class="form-field">
          <label for="pw">Mot de passe</label>
          <input id="pw" type="password" formControlName="password" />
          @if (form.controls.password.touched && form.controls.password.invalid) { <span class="error">6 caractères minimum.</span> }
        </div>
        <div class="form-field">
          <label for="cf">Confirmer le mot de passe</label>
          <input id="cf" type="password" formControlName="confirm" />
          @if (form.controls.confirm.touched && form.hasError('mismatch')) { <span class="error">Les mots de passe diffèrent.</span> }
        </div>
        <button class="btn btn-primary btn-block" type="submit">Créer mon compte</button>
      </form>
      <p class="switch text-muted">Déjà inscrit ? <a routerLink="/auth/login">Se connecter</a></p>
    </app-card>
  `,
  styles: [`
    .auth-card { width: min(100%, 440px); }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
    .switch { margin: var(--space-4) 0 0; text-align: center; }
    @media (max-width: 420px) { .two { grid-template-columns: 1fr; } }
  `]
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', Validators.required]
  }, { validators: passwordsMatch });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Aucune création de compte en Phase 3 : retour à la connexion.
    this.router.navigate(['/auth/login']);
  }
}

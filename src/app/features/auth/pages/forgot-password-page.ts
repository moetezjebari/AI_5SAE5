import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Card } from '../../../shared/components/card';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, Card],
  template: `
    <app-card class="auth-card">
      <h2>Mot de passe oublié</h2>
      <p class="text-muted">Entrez votre e-mail pour recevoir un lien de réinitialisation.</p>
      @if (sent()) {
        <p class="ok"><span class="material-symbols-outlined">mark_email_read</span>
          Si un compte existe, un e-mail vous sera envoyé (simulation).</p>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-field">
            <label for="em">Adresse e-mail</label>
            <input id="em" type="email" formControlName="email" />
            @if (form.controls.email.touched && form.controls.email.invalid) { <span class="error">E-mail valide requis.</span> }
          </div>
          <button class="btn btn-primary btn-block" type="submit">Envoyer le lien</button>
        </form>
      }
      <p class="back"><a routerLink="/auth/login">← Retour à la connexion</a></p>
    </app-card>
  `,
  styles: [`
    .auth-card { width: min(100%, 400px); }
    .ok { display: flex; gap: var(--space-2); color: var(--color-success); }
    .back { margin: var(--space-4) 0 0; text-align: center; }
  `]
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  protected readonly sent = signal(false);
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sent.set(true);
  }
}

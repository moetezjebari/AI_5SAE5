import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ThemeService } from '../../../core/services/theme.service';
import { Card } from '../../../shared/components/card';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-profile-page',
  imports: [PageHeader, Card, ReactiveFormsModule],
  template: `
    <app-page-header title="Mon profil" subtitle="Gérez vos informations et vos préférences." />

    <div class="layout">
      <app-card class="identity">
        <span class="big-avatar">{{ form.controls.firstName.value.charAt(0) }}</span>
        <h2>{{ form.controls.firstName.value }} {{ form.controls.lastName.value }}</h2>
        <p class="text-muted">{{ form.controls.email.value }}</p>
        <span class="badge">Étudiant</span>
      </app-card>

      <div class="forms">
        <app-card title="Informations personnelles">
          <form [formGroup]="form" (ngSubmit)="form.markAllAsTouched()">
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
              <label for="em">E-mail</label>
              <input id="em" type="email" formControlName="email" />
              @if (form.controls.email.touched && form.controls.email.invalid) { <span class="error">E-mail invalide.</span> }
            </div>
            <div class="two">
              <div class="form-field">
                <label for="fl">Filière</label>
                <select id="fl" formControlName="field">
                  <option>Informatique</option><option>Réseaux</option><option>Data & IA</option>
                </select>
              </div>
              <div class="form-field">
                <label for="lv">Niveau</label>
                <select id="lv" formControlName="level">
                  <option>Licence 1</option><option>Licence 2</option><option>Licence 3</option><option>Master</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary" type="submit">Enregistrer</button>
          </form>
        </app-card>

        <app-card title="Préférences">
          <div class="pref">
            <div><strong>Thème sombre</strong><div class="text-muted">Adapte l'interface à votre environnement.</div></div>
            <button class="btn" (click)="theme.toggle()">{{ theme.theme() === 'dark' ? 'Désactiver' : 'Activer' }}</button>
          </div>
          <div class="pref">
            <div><strong>Notifications par e-mail</strong><div class="text-muted">Rappels de révision et nouveautés.</div></div>
            <input type="checkbox" checked aria-label="Notifications par e-mail" />
          </div>
        </app-card>

        <app-card title="Sécurité">
          <form [formGroup]="passwordForm" (ngSubmit)="passwordForm.markAllAsTouched()">
            <div class="form-field">
              <label for="cp">Mot de passe actuel</label>
              <input id="cp" type="password" formControlName="current" />
            </div>
            <div class="form-field">
              <label for="np">Nouveau mot de passe</label>
              <input id="np" type="password" formControlName="next" />
              @if (passwordForm.controls.next.touched && passwordForm.controls.next.invalid) { <span class="error">6 caractères minimum.</span> }
            </div>
            <button class="btn" type="submit">Changer le mot de passe</button>
          </form>
        </app-card>
      </div>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 280px 1fr; gap: var(--space-4); align-items: start; }
    .identity { text-align: center; }
    .big-avatar { display: inline-grid; place-items: center; width: 80px; height: 80px; margin-bottom: var(--space-3); font-size: 2rem; font-weight: 700; color: #fff; background: var(--color-primary); border-radius: 50%; }
    .forms { display: grid; gap: var(--space-4); }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .pref { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border); }
    .pref:last-child { border-bottom: 0; }
    @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } }
    @media (max-width: 520px) { .two { grid-template-columns: 1fr; gap: 0; } }
  `]
})
export class ProfilePage {
  private readonly fb = inject(FormBuilder);
  protected readonly theme = inject(ThemeService);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['Étudiant', Validators.required],
    lastName: ['Démo', Validators.required],
    email: ['etudiant@exemple.com', [Validators.required, Validators.email]],
    field: ['Informatique'],
    level: ['Licence 3']
  });

  protected readonly passwordForm = this.fb.nonNullable.group({
    current: [''],
    next: ['', [Validators.required, Validators.minLength(6)]]
  });
}

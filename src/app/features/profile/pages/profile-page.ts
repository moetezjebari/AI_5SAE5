import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Role } from '../../../core/models/user.model';
import { Card } from '../../../shared/components/card';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [PageHeader, Card, ReactiveFormsModule],
  template: `
    <app-page-header title="Mon profil" subtitle="Gérez vos informations et vos préférences." />

    @if (profileSuccess()) {
      <div class="alert alert-success">
        <span class="material-symbols-outlined">check_circle</span>
        <span>{{ profileSuccess() }}</span>
      </div>
    }

    @if (profileError()) {
      <div class="alert alert-danger">
        <span class="material-symbols-outlined">error</span>
        <span>{{ profileError() }}</span>
      </div>
    }

    <div class="layout">
      <!-- User Identity Card -->
      <app-card class="identity">
        <span class="big-avatar">{{ avatarInitial() }}</span>
        <h2>{{ displayName() }}</h2>
        <p class="text-muted">{{ displayEmail() }}</p>
        <span class="badge" [class.badge-teacher]="user()?.role === 'TEACHER'" [class.badge-admin]="user()?.role === 'ADMIN'">
          {{ roleLabel(user()?.role) }}
        </span>
      </app-card>

      <div class="forms">
        <!-- Personal Information Form -->
        <app-card title="Informations personnelles">
          <form [formGroup]="form" (ngSubmit)="saveProfile()">
            <div class="two">
              <div class="form-field">
                <label for="fn">Prénom <span class="required">*</span></label>
                <input id="fn" formControlName="firstName" />
                @if (form.controls.firstName.touched && form.controls.firstName.invalid) {
                  <span class="error">Le prénom est requis.</span>
                }
              </div>
              <div class="form-field">
                <label for="ln">Nom <span class="required">*</span></label>
                <input id="ln" formControlName="lastName" />
                @if (form.controls.lastName.touched && form.controls.lastName.invalid) {
                  <span class="error">Le nom est requis.</span>
                }
              </div>
            </div>

            <div class="form-field">
              <label for="em">Adresse e-mail <span class="required">*</span></label>
              <input id="em" type="email" formControlName="email" />
              @if (form.controls.email.touched && form.controls.email.invalid) {
                <span class="error">Adresse e-mail valide requise.</span>
              }
            </div>

            <div class="two">
              <div class="form-field">
                <label for="fl">Filière / Domaine</label>
                <select id="fl" formControlName="field">
                  <option>Informatique</option>
                  <option>Réseaux & Télécoms</option>
                  <option>Data & IA</option>
                  <option>Cybersécurité</option>
                </select>
              </div>
              <div class="form-field">
                <label for="lv">Niveau académique</label>
                <select id="lv" formControlName="level">
                  <option>Licence 1</option>
                  <option>Licence 2</option>
                  <option>Licence 3</option>
                  <option>Master 1</option>
                  <option>Master 2</option>
                  <option>Enseignant / Formateur</option>
                </select>
              </div>
            </div>

            <button class="btn btn-primary" type="submit" [disabled]="savingProfile() || form.invalid">
              <span class="material-symbols-outlined" [class.spin]="savingProfile()">
                {{ savingProfile() ? 'progress_activity' : 'save' }}
              </span>
              {{ savingProfile() ? 'Enregistrement…' : 'Enregistrer les modifications' }}
            </button>
          </form>
        </app-card>

        <!-- Preferences -->
        <app-card title="Préférences">
          <div class="pref">
            <div>
              <strong>Thème sombre</strong>
              <div class="text-muted">Adapte l'interface à votre environnement.</div>
            </div>
            <button class="btn" (click)="theme.toggle()">
              {{ theme.theme() === 'dark' ? 'Désactiver' : 'Activer' }}
            </button>
          </div>
          <div class="pref">
            <div>
              <strong>Notifications par e-mail</strong>
              <div class="text-muted">Rappels de cours, quiz et recommandations.</div>
            </div>
            <input type="checkbox" [checked]="emailNotifications" (change)="toggleEmailNotifications($event)" aria-label="Notifications par e-mail" />
          </div>
        </app-card>

        <!-- Security / Password Change -->
        <app-card title="Sécurité">
          @if (passwordSuccess()) {
            <div class="alert alert-success" style="margin-bottom: var(--space-3);">
              <span class="material-symbols-outlined">check_circle</span>
              <span>{{ passwordSuccess() }}</span>
            </div>
          }
          @if (passwordError()) {
            <div class="alert alert-danger" style="margin-bottom: var(--space-3);">
              <span class="material-symbols-outlined">error</span>
              <span>{{ passwordError() }}</span>
            </div>
          }

          <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
            <div class="form-field">
              <label for="cp">Mot de passe actuel <span class="required">*</span></label>
              <input id="cp" type="password" formControlName="current" />
              @if (passwordForm.controls.current.touched && passwordForm.controls.current.invalid) {
                <span class="error">Mot de passe actuel requis.</span>
              }
            </div>

            <div class="form-field">
              <label for="np">Nouveau mot de passe <span class="required">*</span></label>
              <input id="np" type="password" formControlName="next" />
              @if (passwordForm.controls.next.touched && passwordForm.controls.next.invalid) {
                <span class="error">6 caractères minimum requis.</span>
              }
            </div>

            <button class="btn btn-secondary" type="submit" [disabled]="changingPassword() || passwordForm.invalid">
              <span class="material-symbols-outlined" [class.spin]="changingPassword()">
                {{ changingPassword() ? 'progress_activity' : 'lock_reset' }}
              </span>
              {{ changingPassword() ? 'Modification…' : 'Changer le mot de passe' }}
            </button>
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
    .form-field { margin-bottom: var(--space-3); }
    .form-field label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; }
    .form-field input, .form-field select { width: 100%; padding: 10px 12px; font: inherit; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); }
    .error { font-size: 0.8rem; color: var(--color-danger); margin-top: 4px; display: block; }
    .required { color: var(--color-danger); }
    .badge-teacher { background: rgba(245, 158, 11, 0.15); color: #b45309; }
    .badge-admin { background: rgba(239, 68, 68, 0.15); color: #b91c1c; }
    .pref { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border); }
    .pref:last-child { border-bottom: 0; }
    .alert { padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-4); font-size: 0.9rem; display: flex; align-items: center; gap: 8px; }
    .alert-success { background: color-mix(in srgb, var(--color-success) 12%, transparent); color: var(--color-success); border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent); }
    .alert-danger { background: color-mix(in srgb, var(--color-danger) 12%, transparent); color: var(--color-danger); border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent); }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } }
    @media (max-width: 520px) { .two { grid-template-columns: 1fr; gap: 0; } }
  `]
})
export class ProfilePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly authApi = inject(AuthApiService);
  protected readonly theme = inject(ThemeService);

  protected readonly user = this.auth.user;

  protected readonly savingProfile = signal(false);
  protected readonly profileSuccess = signal<string | null>(null);
  protected readonly profileError = signal<string | null>(null);

  protected readonly changingPassword = signal(false);
  protected readonly passwordSuccess = signal<string | null>(null);
  protected readonly passwordError = signal<string | null>(null);

  protected emailNotifications = true;

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    field: [localStorage.getItem('lms_pref_field') || 'Informatique'],
    level: [localStorage.getItem('lms_pref_level') || 'Licence 3']
  });

  protected readonly passwordForm = this.fb.nonNullable.group({
    current: ['', Validators.required],
    next: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    const u = this.user();
    if (u) {
      this.form.patchValue({
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || ''
      });
    }

    // Refresh from backend to guarantee latest user data
    this.authApi.getMe().subscribe({
      next: (serverUser) => {
        if (serverUser) {
          this.form.patchValue({
            firstName: serverUser.firstName || '',
            lastName: serverUser.lastName || '',
            email: serverUser.email || ''
          });
        }
      },
      error: (err) => console.warn('Could not refresh profile from server:', err)
    });

    const notifSaved = localStorage.getItem('lms_pref_notifs');
    if (notifSaved !== null) {
      this.emailNotifications = notifSaved === 'true';
    }
  }

  protected avatarInitial(): string {
    const fn = this.form.controls.firstName.value || this.user()?.firstName;
    return (fn ? fn.charAt(0) : 'U').toUpperCase();
  }

  protected displayName(): string {
    const fn = this.form.controls.firstName.value;
    const ln = this.form.controls.lastName.value;
    if (fn || ln) {
      return `${fn} ${ln}`.trim();
    }
    const u = this.user();
    if (u && (u.firstName || u.lastName)) {
      return `${u.firstName || ''} ${u.lastName || ''}`.trim();
    }
    return u?.email || 'Utilisateur';
  }

  protected displayEmail(): string {
    return this.form.controls.email.value || this.user()?.email || '—';
  }

  protected roleLabel(role?: Role): string {
    if (role === 'TEACHER') return 'Enseignant';
    if (role === 'ADMIN') return 'Administrateur';
    return 'Étudiant';
  }

  protected saveProfile(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, field, level } = this.form.getRawValue();
    localStorage.setItem('lms_pref_field', field);
    localStorage.setItem('lms_pref_level', level);

    this.savingProfile.set(true);
    this.profileSuccess.set(null);
    this.profileError.set(null);

    this.authApi.updateProfile(firstName, lastName, email).subscribe({
      next: (updatedUser) => {
        this.savingProfile.set(false);
        this.profileSuccess.set('Vos informations personnelles ont été enregistrées avec succès.');
        setTimeout(() => this.profileSuccess.set(null), 5000);
      },
      error: (err) => {
        this.savingProfile.set(false);
        this.profileError.set(err.error?.message || 'Erreur lors de la mise à jour de vos informations.');
      }
    });
  }

  protected toggleEmailNotifications(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.emailNotifications = checked;
    localStorage.setItem('lms_pref_notifs', String(checked));
  }

  protected changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { current, next } = this.passwordForm.getRawValue();
    this.changingPassword.set(true);
    this.passwordSuccess.set(null);
    this.passwordError.set(null);

    this.authApi.changePassword(current, next).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.passwordSuccess.set('Votre mot de passe a été modifié avec succès.');
        this.passwordForm.reset();
        setTimeout(() => this.passwordSuccess.set(null), 5000);
      },
      error: (err) => {
        this.changingPassword.set(false);
        this.passwordError.set(err.error?.message || 'Erreur lors de la modification du mot de passe.');
      }
    });
  }
}

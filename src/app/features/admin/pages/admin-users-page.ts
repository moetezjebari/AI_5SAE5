import { Component, OnInit, inject, signal } from '@angular/core';
import { Role, User } from '../../../core/models/user.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { errorMessage } from '../../../core/utils/http-error';
import { Card } from '../../../shared/components/card';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-admin-users-page',
  imports: [PageHeader, Card],
  template: `
    <app-page-header title="Utilisateurs" subtitle="Administration des comptes et des rôles." />
    <app-card>
      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th></tr></thead>
          <tbody>
            @for (u of users(); track u.id) {
              <tr>
                <td>{{ u.firstName }} {{ u.lastName }}</td>
                <td>{{ u.email }}</td>
                <td>
                  <select [value]="u.role" [disabled]="u.id === me()?.id" (change)="setRole(u, $any($event.target).value)"
                          [attr.aria-label]="'Rôle de ' + u.email">
                    @for (r of roles; track r) { <option [value]="r" [selected]="r === u.role">{{ r }}</option> }
                  </select>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </app-card>
  `,
  styles: [`
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: var(--space-2) var(--space-3); text-align: left; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
  `]
})
export class AdminUsersPage implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly me = inject(AuthService).user;
  protected readonly roles: Role[] = ['STUDENT', 'TEACHER', 'ADMIN'];
  protected readonly users = signal<User[]>([]);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.api.get<User[]>('/users').subscribe({
      next: list => this.users.set(list),
      error: err => this.error.set(errorMessage(err, 'Chargement impossible.'))
    });
  }

  protected setRole(u: User, role: Role): void {
    this.error.set('');
    this.api.put<User>(`/users/${u.id}/role`, { role }).subscribe({
      next: updated => this.users.update(l => l.map(x => (x.id === updated.id ? { ...x, role: updated.role } : x))),
      error: err => {
        this.error.set(errorMessage(err, 'Changement de rôle impossible.'));
        this.load();
      }
    });
  }
}

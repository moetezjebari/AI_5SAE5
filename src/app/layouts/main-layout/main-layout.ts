import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  protected readonly themeService = inject(ThemeService);

  protected readonly user = this.auth.user;
  protected readonly menuOpen = signal(false);

  protected get groups(): NavGroup[] {
    const isTeacher = this.user()?.role === 'TEACHER' || this.user()?.role === 'ADMIN';
    return [
      {
        title: 'Apprentissage',
        items: [
          { path: '/dashboard', label: 'Tableau de bord', icon: 'dashboard' },
          { path: '/courses', label: 'Cours', icon: 'menu_book' },
          { path: '/exercises', label: 'Exercices', icon: 'edit_note' },
          { path: '/quizzes', label: 'Quiz', icon: 'quiz' },
          { path: '/performance', label: 'Performance', icon: 'monitoring' }
        ]
      },
      {
        title: isTeacher ? 'Gestion & IA' : 'Intelligence artificielle',
        items: [
          { path: '/assistant', label: 'Assistant IA', icon: 'smart_toy' },
          { path: '/courses/summary', label: 'Résumé de cours', icon: 'summarize' },
          { path: '/quizzes/generate', label: 'Générateur de quiz', icon: 'auto_awesome' },
          {
            path: '/recommendations',
            label: isTeacher ? 'Gestion recommandations' : 'Recommandations',
            icon: isTeacher ? 'recommend' : 'lightbulb'
          }
        ]
      },
      {
        title: 'Compte',
        items: [
          { path: '/profile', label: 'Profil', icon: 'person' },
          ...(this.user()?.role === 'ADMIN' ? [{ path: '/admin/users', label: 'Utilisateurs', icon: 'admin_panel_settings' }] : [])
        ]
      }
    ];
  }

  private get allPaths(): string[] {
    return this.groups.flatMap(g => g.items.map(i => i.path));
  }

  /** Un lien est actif s'il correspond au plus long chemin de menu préfixant l'URL courante. */
  protected isActive(path: string): boolean {
    const url = this.router.url.split(/[?#]/)[0];
    const best = this.allPaths
      .filter(p => url === p || url.startsWith(p + '/'))
      .sort((a, b) => b.length - a.length)[0];
    return best === path;
  }

  ngOnInit(): void {
    // Charge photo et profil détaillé (la session restaurée ne contient que les données du jeton).
    this.authApi.getMe().subscribe({ error: () => undefined });
  }

  protected logout(): void {
    this.authApi.logout().subscribe(() => this.router.navigate(['/auth/login']));
  }
}

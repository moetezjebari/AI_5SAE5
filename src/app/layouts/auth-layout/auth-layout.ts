import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <div class="auth">
      <section class="hero">
        <div class="brand"><span class="material-symbols-outlined">school</span> LMS Platform</div>
        <h1>Apprenez, progressez, réussissez.</h1>
        <p>Une plateforme intelligente pour vous accompagner dans votre parcours d'apprentissage.</p>
      </section>
      <section class="panel"><router-outlet /></section>
    </div>
  `,
  styles: [`
    .auth { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
    .hero {
      display: flex; flex-direction: column; justify-content: center; gap: var(--space-3);
      padding: var(--space-6); color: #fff;
      background: linear-gradient(135deg, #4f46e5, #0d9488);
    }
    .hero h1 { font-size: 2.2rem; margin: 0; }
    .hero p { max-width: 420px; opacity: 0.9; }
    .brand { display: flex; align-items: center; gap: var(--space-2); font-weight: 700; font-size: 1.2rem; }
    .panel { display: grid; place-items: center; padding: var(--space-5); }
    @media (max-width: 860px) {
      .auth { grid-template-columns: 1fr; }
      .hero { padding: var(--space-5); }
      .hero h1 { font-size: 1.5rem; }
    }
  `]
})
export class AuthLayout {}

import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MOCK_CHAT, MOCK_CHAT_HISTORY } from '../../../core/mocks/mock-data';
import { ChatMessage } from '../../../core/models/lms.model';
import { Card } from '../../../shared/components/card';
import { PageHeader } from '../../../shared/components/page-header';

@Component({
  selector: 'app-assistant-page',
  imports: [PageHeader, Card, FormsModule],
  template: `
    <app-page-header title="Assistant IA" subtitle="Posez vos questions sur vos cours, à tout moment." />

    <div class="layout">
      <app-card title="Historique" class="history">
        <button class="btn btn-block new" (click)="reset()">
          <span class="material-symbols-outlined">add</span> Nouvelle conversation
        </button>
        @for (h of history; track h) {
          <div class="item"><span class="material-symbols-outlined">chat_bubble</span> {{ h }}</div>
        }
      </app-card>

      <app-card class="chat">
        <div class="messages">
          @for (m of messages(); track $index) {
            <div class="msg" [class.user]="m.from === 'user'">
              <span class="avatar material-symbols-outlined">{{ m.from === 'user' ? 'person' : 'smart_toy' }}</span>
              <div class="bubble">{{ m.text }}</div>
            </div>
          }
          @if (typing()) {
            <div class="msg"><span class="avatar material-symbols-outlined">smart_toy</span>
              <div class="bubble text-muted">L'assistant écrit…</div></div>
          }
        </div>

        <div class="suggestions">
          @for (s of suggestions; track s) {
            <button class="btn chip" (click)="send(s)">{{ s }}</button>
          }
        </div>

        <form class="composer" (ngSubmit)="send(draft)">
          <input name="draft" [(ngModel)]="draft" placeholder="Écrivez votre question…" autocomplete="off" />
          <button class="btn btn-primary" type="submit" [disabled]="!draft.trim() || typing()">
            <span class="material-symbols-outlined">send</span>
          </button>
        </form>
      </app-card>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 260px 1fr; gap: var(--space-4); align-items: start; }
    .new { margin-bottom: var(--space-3); }
    .item { display: flex; gap: var(--space-2); padding: var(--space-2) 0; color: var(--color-text-muted); font-size: 0.9rem; }
    .item .material-symbols-outlined { font-size: 18px; }
    .chat { display: flex; flex-direction: column; }
    .messages { display: flex; flex-direction: column; gap: var(--space-3); min-height: 320px; max-height: 50vh; overflow-y: auto; margin-bottom: var(--space-4); }
    .msg { display: flex; gap: var(--space-3); align-items: flex-start; }
    .msg.user { flex-direction: row-reverse; }
    .avatar { padding: 6px; border-radius: 50%; background: var(--color-primary-soft); color: var(--color-primary); font-size: 20px; }
    .bubble { max-width: 75%; padding: 10px var(--space-4); background: var(--color-bg); border-radius: var(--radius-lg); }
    .user .bubble { background: var(--color-primary); color: #fff; }
    .suggestions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-3); }
    .chip { padding: 5px 12px; font-size: 0.85rem; }
    .composer { display: flex; gap: var(--space-2); }
    .composer input { flex: 1; padding: 10px 12px; font: inherit; color: var(--color-text); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } .history { display: none; } }
  `]
})
export class AssistantPage {
  protected readonly history = MOCK_CHAT_HISTORY;
  protected readonly suggestions = [
    'Explique-moi la récursivité',
    'Fais-moi un plan de révision',
    'Quelle est la différence entre INNER et LEFT JOIN ?'
  ];
  protected readonly messages = signal<ChatMessage[]>([...MOCK_CHAT]);
  protected readonly typing = signal(false);
  protected draft = '';

  protected send(text: string): void {
    const value = text.trim();
    if (!value || this.typing()) return;
    this.messages.update(m => [...m, { from: 'user', text: value }]);
    this.draft = '';
    this.typing.set(true);
    setTimeout(() => {
      this.messages.update(m => [...m, {
        from: 'assistant',
        text: 'Ceci est une réponse fictive (Phase 3). L\'assistant sera relié à l\'IA dans une phase ultérieure.'
      }]);
      this.typing.set(false);
    }, 800);
  }

  protected reset(): void {
    this.messages.set([...MOCK_CHAT]);
  }
}

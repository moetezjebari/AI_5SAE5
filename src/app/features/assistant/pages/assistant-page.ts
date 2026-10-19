import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssistantMessage, AssistantService, Conversation } from '../../../core/services/assistant.service';
import { errorMessage } from '../../../core/utils/http-error';
import { Card } from '../../../shared/components/card';
import { PageHeader } from '../../../shared/components/page-header';

const WELCOME: AssistantMessage = {
  role: 'assistant',
  content: 'Bonjour ! Je suis votre assistant d’apprentissage. Posez-moi une question, ou demandez-moi de vous expliquer une notion.'
};

@Component({
  selector: 'app-assistant-page',
  imports: [PageHeader, Card, FormsModule],
  template: `
    <app-page-header title="Assistant IA" subtitle="Posez vos questions, à tout moment." />

    <div class="layout">
      <app-card title="Historique" class="history" [class.show]="showHistory()">
        <button class="btn btn-block new" (click)="newConversation()">
          <span class="material-symbols-outlined">add</span> Nouvelle conversation
        </button>
        @for (c of conversations(); track c.id) {
          <div class="item" [class.active]="c.id === conversationId()">
            <button class="open" (click)="open(c)" [title]="c.title">
              <span class="material-symbols-outlined">chat_bubble</span><span class="t">{{ c.title }}</span>
            </button>
            <button class="del" (click)="remove(c)" aria-label="Supprimer la conversation">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        } @empty {
          <p class="text-muted small">Aucune conversation pour le moment.</p>
        }
      </app-card>

      <app-card class="chat">
        <button class="btn toggle" (click)="showHistory.set(!showHistory())">
          <span class="material-symbols-outlined">history</span> Historique
        </button>
        <div class="messages" #scroller aria-live="polite">
          @for (m of messages(); track $index) {
            <div class="msg" [class.user]="m.role === 'user'">
              <span class="avatar material-symbols-outlined">{{ m.role === 'user' ? 'person' : 'smart_toy' }}</span>
              <div class="bubble">{{ m.content }}</div>
            </div>
          }
          @if (typing()) {
            <div class="msg"><span class="avatar material-symbols-outlined">smart_toy</span>
              <div class="bubble text-muted">L'assistant écrit…</div></div>
          }
        </div>

        @if (error()) {
          <div class="alert" role="alert">
            <span>{{ error() }}</span>
            @if (lastFailed) { <button class="btn" (click)="retry()">Réessayer</button> }
          </div>
        }

        @if (messages().length <= 1) {
          <div class="suggestions">
            @for (s of suggestions; track s) {
              <button class="btn chip" (click)="send(s)" [disabled]="typing()">{{ s }}</button>
            }
          </div>
        }

        <form class="composer" (ngSubmit)="send(draft)">
          <input name="draft" [(ngModel)]="draft" placeholder="Écrivez votre question…" autocomplete="off"
                 maxlength="2000" [disabled]="typing()" aria-label="Votre message" />
          <button class="btn btn-primary" type="submit" [disabled]="!draft.trim() || typing()" aria-label="Envoyer">
            <span class="material-symbols-outlined">send</span>
          </button>
        </form>
      </app-card>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 280px 1fr; gap: var(--space-4); align-items: start; }
    .new { margin-bottom: var(--space-3); }
    .small { font-size: 0.85rem; }
    .item { display: flex; align-items: center; gap: var(--space-1); border-radius: var(--radius-md); }
    .item.active { background: var(--color-primary-soft); }
    .item .open { flex: 1; min-width: 0; display: flex; gap: var(--space-2); align-items: center; padding: var(--space-2); background: none; border: 0; color: var(--color-text-muted); font: inherit; font-size: 0.9rem; text-align: left; cursor: pointer; }
    .item .t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .item .del { background: none; border: 0; color: var(--color-text-muted); cursor: pointer; padding: 4px; }
    .item .material-symbols-outlined { font-size: 18px; }
    .chat { display: flex; flex-direction: column; }
    .toggle { display: none; margin-bottom: var(--space-3); }
    .messages { display: flex; flex-direction: column; gap: var(--space-3); min-height: 320px; max-height: 55vh; overflow-y: auto; margin-bottom: var(--space-4); }
    .msg { display: flex; gap: var(--space-3); align-items: flex-start; }
    .msg.user { flex-direction: row-reverse; }
    .avatar { padding: 6px; border-radius: 50%; background: var(--color-primary-soft); color: var(--color-primary); font-size: 20px; }
    .bubble { max-width: 75%; padding: 10px var(--space-4); background: var(--color-bg); border-radius: var(--radius-lg); white-space: pre-wrap; overflow-wrap: anywhere; }
    .user .bubble { background: var(--color-primary); color: #fff; }
    .alert { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); color: var(--color-danger, #b91c1c); border: 1px solid currentColor; }
    .suggestions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-3); }
    .chip { padding: 5px 12px; font-size: 0.85rem; }
    .composer { display: flex; gap: var(--space-2); }
    .composer input { flex: 1; padding: 10px 12px; font: inherit; color: var(--color-text); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; }
      .history { display: none; }
      .history.show { display: block; }
      .toggle { display: inline-flex; align-self: flex-start; }
      .bubble { max-width: 88%; }
    }
  `]
})
export class AssistantPage implements OnInit, AfterViewChecked {
  private readonly assistant = inject(AssistantService);
  @ViewChild('scroller') private scroller?: ElementRef<HTMLElement>;

  protected readonly suggestions = [
    'Explique-moi la récursivité',
    'Fais-moi un plan de révision',
    'Quelle est la différence entre INNER et LEFT JOIN ?'
  ];
  protected readonly conversations = signal<Conversation[]>([]);
  protected readonly conversationId = signal<number | null>(null);
  protected readonly messages = signal<AssistantMessage[]>([WELCOME]);
  protected readonly typing = signal(false);
  protected readonly error = signal('');
  protected readonly showHistory = signal(false);
  protected draft = '';
  protected lastFailed: { text: string; clientId: string } | null = null;
  private stickToBottom = false;

  ngOnInit(): void {
    this.loadConversations();
  }

  ngAfterViewChecked(): void {
    if (this.stickToBottom && this.scroller) {
      const el = this.scroller.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.stickToBottom = false;
    }
  }

  private loadConversations(): void {
    this.assistant.conversations().subscribe({
      next: list => this.conversations.set(list),
      error: err => this.error.set(errorMessage(err, "Impossible de charger l'historique."))
    });
  }

  protected newConversation(): void {
    this.conversationId.set(null);
    this.messages.set([WELCOME]);
    this.error.set('');
    this.lastFailed = null;
    this.showHistory.set(false);
  }

  protected open(c: Conversation): void {
    this.error.set('');
    this.lastFailed = null;
    this.assistant.messages(c.id).subscribe({
      next: list => {
        this.conversationId.set(c.id);
        this.messages.set([WELCOME, ...list]);
        this.stickToBottom = true;
        this.showHistory.set(false);
      },
      error: err => this.error.set(errorMessage(err, 'Conversation introuvable.'))
    });
  }

  protected remove(c: Conversation): void {
    this.assistant.remove(c.id).subscribe({
      next: () => {
        this.conversations.update(l => l.filter(x => x.id !== c.id));
        if (this.conversationId() === c.id) this.newConversation();
      },
      error: err => this.error.set(errorMessage(err, 'Suppression impossible.'))
    });
  }

  protected send(text: string, clientId: string = crypto.randomUUID()): void {
    const value = text.trim();
    if (!value || this.typing()) return;
    this.error.set('');
    this.lastFailed = null;
    // Sur un nouvel essai le message est déjà affiché : on ne le duplique pas à l'écran.
    if (!this.messages().some(m => m.role === 'user' && m.content === value && this.lastSentId === clientId)) {
      this.messages.update(m => [...m, { role: 'user', content: value }]);
    }
    this.lastSentId = clientId;
    this.draft = '';
    this.typing.set(true);
    this.stickToBottom = true;
    this.assistant.chat(value, this.conversationId(), clientId).subscribe({
      next: res => {
        this.conversationId.set(res.conversationId);
        this.messages.update(m => [...m, res.reply]);
        this.typing.set(false);
        this.stickToBottom = true;
        this.loadConversations();
      },
      error: err => {
        this.typing.set(false);
        this.lastFailed = { text: value, clientId };
        this.error.set(errorMessage(err, "L'assistant n'a pas pu répondre."));
        // Le serveur a pu enregistrer la conversation avant l'échec IA : on la rafraîchit.
        this.loadConversations();
      }
    });
  }

  private lastSentId = '';

  protected retry(): void {
    if (this.lastFailed) this.send(this.lastFailed.text, this.lastFailed.clientId);
  }
}

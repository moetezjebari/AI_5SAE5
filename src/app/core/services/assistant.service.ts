import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface ChatResponse {
  conversationId: number;
  userMessage: AssistantMessage;
  reply: AssistantMessage;
}

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly api = inject(ApiService);

  chat(message: string, conversationId: number | null, clientMessageId: string): Observable<ChatResponse> {
    return this.api.post<ChatResponse>('/assistant/chat', { conversationId, message, clientMessageId });
  }

  conversations(): Observable<Conversation[]> {
    return this.api.get<Conversation[]>('/assistant/conversations');
  }

  messages(conversationId: number): Observable<AssistantMessage[]> {
    return this.api.get<AssistantMessage[]>(`/assistant/conversations/${conversationId}/messages`);
  }

  remove(conversationId: number): Observable<void> {
    return this.api.delete<void>(`/assistant/conversations/${conversationId}`);
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AiAssistantContextService } from './ai-assistant-context.service';
import { TranslateService } from './translate.service';

export interface AiCitation {
  index: number;
  id: string;
  section: string;
  title: string;
  excerpt: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Knowledge-base passages the reply cited as [n]; the backend drops any that don't resolve. */
  citations?: AiCitation[];
  /** The knowledge base had nothing on this question, so the reply leaned on deal context only. */
  knowledgeUnavailable?: boolean;
}

export interface AiSuggestedPrompt {
  id: string;
  labelKey: string;
  prompt: string;
}

interface CopilotChatResponse {
  success: boolean;
  reply: string;
  errorCode?: string | null;
  usedRag?: boolean;
  provider?: string | null;
  citations?: AiCitation[];
  knowledgeUnavailable?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  private readonly http = inject(HttpClient);
  private readonly ctx = inject(AiAssistantContextService);
  private readonly i18n = inject(TranslateService);

  readonly open = signal(false);
  readonly messages = signal<AiChatMessage[]>([]);
  readonly thinking = signal(false);
  readonly isDemo = false;
  readonly lastError = signal<string | null>(null);

  readonly suggestedPrompts: AiSuggestedPrompt[] = [
    {
      id: 'explain-match',
      labelKey: 'common.aiExplainMatch',
      prompt: 'Explain why this farm matched my supply request.',
    },
    {
      id: 'summarize-risk',
      labelKey: 'common.aiSummarizeRisk',
      prompt: 'Summarize the main risk factors for this match.',
    },
    {
      id: 'draft-message',
      labelKey: 'common.aiDraftMessage',
      prompt: 'Draft a professional message to the selected farm.',
    },
  ];

  openDrawer(): void {
    this.open.set(true);
    document.body.classList.add('overflow-hidden');
  }

  closeDrawer(): void {
    this.open.set(false);
    document.body.classList.remove('overflow-hidden');
  }

  toggle(): void {
    if (this.open()) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  sendPrompt(prompt: string, promptId?: string): void {
    const userMsg: AiChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: prompt,
    };
    this.messages.update((list) => [...list, userMsg]);
    this.thinking.set(true);
    this.lastError.set(null);

    this.http
      .post<CopilotChatResponse>(`${environment.backendUrl}/assistant/chat`, {
        message: prompt,
        promptId: promptId ?? null,
        requestId: this.ctx.requestId(),
        matchId: this.ctx.matchId(),
        contractId: this.ctx.contractId(),
        farmId: this.ctx.farmId(),
      })
      .subscribe({
        next: (res) => {
          const text =
            res.reply?.trim() ||
            this.i18n.instant('common.aiDrawerUnavailable');
          this.messages.update((list) => [
            ...list,
            {
              id: `a-${Date.now()}`,
              role: 'assistant',
              text,
              citations: res.citations ?? [],
              knowledgeUnavailable: res.knowledgeUnavailable ?? false,
            },
          ]);
          this.thinking.set(false);
        },
        error: (err: HttpErrorResponse) => {
          const body = err.error as CopilotChatResponse | undefined;
          const text =
            body?.reply ||
            this.i18n.instant('common.aiDrawerUnavailable');
          this.lastError.set(text);
          this.messages.update((list) => [
            ...list,
            { id: `a-${Date.now()}`, role: 'assistant', text },
          ]);
          this.thinking.set(false);
        },
      });
  }

  clear(): void {
    this.messages.set([]);
    this.thinking.set(false);
    this.lastError.set(null);
  }
}

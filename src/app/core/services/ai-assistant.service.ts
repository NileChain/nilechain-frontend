import { Injectable, signal } from '@angular/core';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface AiSuggestedPrompt {
  id: string;
  labelKey: string;
  prompt: string;
}

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  readonly open = signal(false);
  readonly messages = signal<AiChatMessage[]>([]);
  readonly thinking = signal(false);

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

  /** Demo-only assistant — replies are canned, not a live LLM. */
  readonly isDemo = true;

  private readonly mockReplies: Record<string, string> = {
    'explain-match':
      'This farm scored highly on crop alignment, delivery window, and historical fulfillment. Quantity capacity covers your request with a buffer, and logistics distance is within the preferred governorate set.',
    'summarize-risk':
      'Overall risk is moderate-low. Watch certification expiry within 60 days and seasonal weather variance on the logistics corridor. Contract late-delivery clauses are recommended.',
    'draft-message':
      'Hello,\n\nWe reviewed your farm profile and match score for our current supply request. We would like to discuss quantity confirmation, delivery timeline, and quality specs before generating a draft contract.\n\nBest regards,\nProcurement Team',
    default:
      'I can help explain matches, summarize risk, or draft messages for factory workflows. Try one of the suggested prompts.',
  };

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

    window.setTimeout(() => {
      const reply =
        (promptId && this.mockReplies[promptId]) ||
        this.mockReplies['default'] ||
        '';
      const assistantMsg: AiChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: reply,
      };
      this.messages.update((list) => [...list, assistantMsg]);
      this.thinking.set(false);
    }, 700);
  }

  clear(): void {
    this.messages.set([]);
    this.thinking.set(false);
  }
}

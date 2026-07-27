import { Component, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { AuthService } from '../../../core/services/auth.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { ConversationItem } from '../../../core/models/farm/conversation-item.model';
import { MessageItem } from '../../../core/models/farm/message-item.model';

@Component({
  selector: 'app-farm-messages',
  standalone: true,
  imports: [TranslatePipe, UiLanguageToggleComponent, UiThemeToggleComponent, DatePipe, FormsModule],
  templateUrl: './farm-messages.component.html',
})
export class FarmMessagesComponent {
  private readonly authService = inject(AuthService);
  private readonly farmService = inject(FarmService);

  readonly currentUser = this.authService.currentUser;
  readonly conversations = signal<ConversationItem[]>([]);
  readonly messages = signal<MessageItem[]>([]);
  readonly loadingConversations = signal(true);
  readonly loadingMessages = signal(false);
  readonly selectedMatchId = signal<string | null>(null);
  readonly messageContent = signal('');
  readonly sending = signal(false);

  readonly selectedConversation = () =>
    this.conversations().find(c => c.matchId === this.selectedMatchId()) ?? null;

  readonly firstLetter = (name: string): string => name?.charAt(0)?.toUpperCase() ?? '?';

  constructor(title: Title) {
    title.setTitle('NileChain - Messages');
    this.loadConversations();
  }

  private loadConversations(): void {
    this.loadingConversations.set(true);
    this.farmService.getConversations().subscribe(data => {
      this.conversations.set(data);
      this.loadingConversations.set(false);
      if (data.length > 0) {
        this.selectConversation(data[0].matchId);
      }
    });
  }

  selectConversation(matchId: string): void {
    this.selectedMatchId.set(matchId);
    this.loadingMessages.set(true);
    this.messages.set([]);
    this.farmService.getMessages(matchId).subscribe(data => {
      this.messages.set(data);
      this.loadingMessages.set(false);
    });
  }

  sendMessage(): void {
    const matchId = this.selectedMatchId();
    const content = this.messageContent();
    if (!matchId || !content?.trim() || this.sending()) return;

    this.sending.set(true);
    this.farmService.sendMessage(matchId, content.trim()).subscribe(() => {
      this.messageContent.set('');
      this.sending.set(false);
      this.farmService.getMessages(matchId).subscribe(data => {
        this.messages.set(data);
      });
    });
  }
}

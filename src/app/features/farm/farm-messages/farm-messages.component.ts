import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AuthService } from '../../../core/services/auth.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { MobileNavService } from '../../../core/services/mobile-nav.service';
import {
  Conversation,
  Message,
} from '../../../core/models/farm/farm-message.model';

@Component({
  selector: 'app-farm-messages',
  standalone: true,
  imports: [
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    FormsModule,
    DatePipe,
  ],
  templateUrl: './farm-messages.component.html',
})
export class FarmMessagesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly farmService = inject(FarmService);
  readonly currentUser = this.authService.currentUser;
  readonly mobileNav = inject(MobileNavService);

  readonly loading = signal(true);
  readonly messagesLoading = signal(false);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly threadError = signal<string | null>(null);
  readonly conversations = signal<Conversation[]>([]);
  readonly messages = signal<Message[]>([]);
  readonly selectedMatchId = signal<string | null>(null);

  draft = '';

  ngOnInit(): void {
    this.loadConversations();
  }

  loadConversations(): void {
    this.loading.set(true);
    this.error.set(null);
    this.farmService
      .getConversations()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.conversations.set(items);
          if (items.length > 0 && !this.selectedMatchId()) {
            this.selectConversation(items[0].matchId);
          }
        },
        error: () => this.error.set('Failed to load conversations.'),
      });
  }

  selectConversation(matchId: string): void {
    this.selectedMatchId.set(matchId);
    this.messagesLoading.set(true);
    this.threadError.set(null);
    this.farmService
      .getMessages(matchId)
      .pipe(finalize(() => this.messagesLoading.set(false)))
      .subscribe({
        next: (items) => this.messages.set(items),
        error: () => this.threadError.set('Failed to load messages.'),
      });
  }

  selectedConversation(): Conversation | undefined {
    const id = this.selectedMatchId();
    return this.conversations().find((c) => c.matchId === id);
  }

  isOutgoing(message: Message): boolean {
    return message.senderId === this.currentUser()?.id;
  }

  send(): void {
    const matchId = this.selectedMatchId();
    const content = this.draft.trim();
    if (!matchId || !content) {
      return;
    }

    this.sending.set(true);
    this.threadError.set(null);
    this.farmService
      .sendMessage(matchId, content)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: () => {
          this.draft = '';
          this.selectConversation(matchId);
          this.loadConversations();
        },
        error: () => this.threadError.set('Failed to send message.'),
      });
  }
}

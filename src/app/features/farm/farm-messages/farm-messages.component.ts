import { DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { AuthService } from '../../../core/services/auth.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { TranslateService } from '../../../core/services/translate.service';
import {
  Conversation,
  Message,
} from '../../../core/models/farm/farm-message.model';

interface ConversationGroup {
  key: string;
  name: string;
  unreadTotal: number;
  threads: Conversation[];
}

@Component({
  selector: 'app-farm-messages',
  standalone: true,
  imports: [
    TranslatePipe,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    AppTopBarComponent,
    FormsModule,
    DatePipe,
  ],
  templateUrl: './farm-messages.component.html',
  styleUrl: './farm-messages.component.scss',
})
export class FarmMessagesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly farmService = inject(FarmService);
  private readonly i18n = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly currentUser = this.authService.currentUser;

  readonly loading = signal(true);
  readonly messagesLoading = signal(false);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly threadError = signal<string | null>(null);
  readonly chatGated = signal(false);
  readonly conversations = signal<Conversation[]>([]);
  readonly messages = signal<Message[]>([]);
  readonly selectedMatchId = signal<string | null>(null);

  readonly groups = computed<ConversationGroup[]>(() => {
    const map = new Map<string, ConversationGroup>();
    for (const thread of this.conversations()) {
      const key = thread.factoryId || thread.factoryName || thread.matchId;
      const existing = map.get(key);
      if (existing) {
        existing.threads.push(thread);
        existing.unreadTotal += thread.unreadCount || 0;
      } else {
        map.set(key, {
          key,
          name: thread.factoryName,
          unreadTotal: thread.unreadCount || 0,
          threads: [thread],
        });
      }
    }
    return [...map.values()].map((g) => ({
      ...g,
      threads: [...g.threads].sort((a, b) => {
        const aAt = Date.parse(a.lastMessageAt || a.matchCreatedAt || '') || 0;
        const bAt = Date.parse(b.lastMessageAt || b.matchCreatedAt || '') || 0;
        return bAt - aAt;
      }),
    }));
  });

  draft = '';
  private pendingMatchId: string | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const matchId = params.get('matchId');
      this.pendingMatchId = matchId;
      if (matchId && this.selectedMatchId() !== matchId) {
        if (this.conversations().some((c) => c.matchId === matchId)) {
          this.selectConversation(matchId);
        } else if (!this.loading()) {
          this.openMatchThread(matchId);
        }
      }
    });
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
          const target = this.pendingMatchId;
          if (target) {
            if (items.some((c) => c.matchId === target)) {
              this.selectConversation(target);
            } else {
              this.openMatchThread(target);
            }
            return;
          }
          if (items.length > 0 && !this.selectedMatchId()) {
            this.selectConversation(items[0].matchId);
          }
        },
        error: () =>
          this.error.set(this.i18n.instant('messages.loadConversationsFailed')),
      });
  }

  selectConversation(matchId: string): void {
    this.selectedMatchId.set(matchId);
    this.syncMatchQuery(matchId);
    this.messagesLoading.set(true);
    this.threadError.set(null);
    this.chatGated.set(false);
    this.farmService
      .getMessages(matchId)
      .pipe(finalize(() => this.messagesLoading.set(false)))
      .subscribe({
        next: (items) => this.messages.set(items),
        error: (err: HttpErrorResponse) => this.handleThreadLoadError(err),
      });
  }

  selectedConversation(): Conversation | undefined {
    const id = this.selectedMatchId();
    return this.conversations().find((c) => c.matchId === id);
  }

  isOutgoing(message: Message): boolean {
    return message.senderId === this.currentUser()?.id;
  }

  matchRef(matchId: string | null | undefined): string {
    if (!matchId) return '—';
    return matchId.replace(/-/g, '').slice(-6).toUpperCase();
  }

  activityAt(convo: Conversation): string | null {
    return convo.lastMessageAt || convo.matchCreatedAt || null;
  }

  dealMeta(convo: Conversation): string {
    const crop = convo.cropName || '—';
    const qty =
      convo.quantityTons != null && convo.quantityTons > 0
        ? Math.round(convo.quantityTons)
        : null;
    const price =
      convo.pricePerTon != null && convo.pricePerTon > 0
        ? Math.round(convo.pricePerTon)
        : null;

    if (qty != null && price != null) {
      return this.i18n.instant('messages.dealMetaWithPrice', {
        crop,
        qty: qty.toString(),
        price: price.toLocaleString(),
      });
    }
    if (qty != null) {
      return this.i18n.instant('messages.dealMeta', {
        crop,
        qty: qty.toString(),
      });
    }
    if (price != null) {
      return this.i18n.instant('messages.dealMetaPriceOnly', {
        crop,
        price: price.toLocaleString(),
      });
    }
    return crop;
  }

  statusLabelKey(status: string | null | undefined): string {
    switch ((status || '').toLowerCase()) {
      case 'proposed':
        return 'farm.matches.statusProposed';
      case 'accepted':
        return 'farm.matches.statusAccepted';
      case 'rejected':
        return 'farm.matches.statusRejected';
      case 'countered':
        return 'farm.matches.statusCountered';
      default:
        return 'farm.matches.statusProposed';
    }
  }

  previewText(convo: Conversation): string {
    return convo.lastMessage?.trim() || this.i18n.instant('messages.noPreview');
  }

  send(): void {
    const matchId = this.selectedMatchId();
    const content = this.draft.trim();
    if (!matchId || !content || this.chatGated()) {
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
        error: (err: HttpErrorResponse) => {
          if (this.isChatGatedError(err)) {
            this.chatGated.set(true);
            this.threadError.set(null);
            return;
          }
          this.threadError.set(this.i18n.instant('messages.sendFailed'));
        },
      });
  }

  private openMatchThread(matchId: string): void {
    this.selectedMatchId.set(matchId);
    this.syncMatchQuery(matchId);
    this.messagesLoading.set(true);
    this.threadError.set(null);
    this.chatGated.set(false);
    this.farmService
      .getMessages(matchId)
      .pipe(finalize(() => this.messagesLoading.set(false)))
      .subscribe({
        next: (items) => {
          this.messages.set(items);
          if (!this.conversations().some((c) => c.matchId === matchId)) {
            this.conversations.update((list) => [
              {
                matchId,
                factoryId: null,
                factoryName: this.i18n.instant('messages.conversationFallback'),
                cropName: null,
                lastMessage: items.at(-1)?.content ?? null,
                lastMessageAt: items.at(-1)?.createdAt ?? null,
                unreadCount: 0,
                contractFullySigned: true,
              },
              ...list,
            ]);
          }
        },
        error: (err: HttpErrorResponse) => this.handleThreadLoadError(err),
      });
  }

  private handleThreadLoadError(err: HttpErrorResponse): void {
    this.messages.set([]);
    if (this.isChatGatedError(err)) {
      this.chatGated.set(true);
      this.threadError.set(null);
      return;
    }
    this.chatGated.set(false);
    this.threadError.set(this.i18n.instant('messages.loadMessagesFailed'));
  }

  private isChatGatedError(err: HttpErrorResponse): boolean {
    const code = err?.error?.code;
    return typeof code === 'string' && code.includes('CannotSendMessage');
  }

  private syncMatchQuery(matchId: string): void {
    const current = this.route.snapshot.queryParamMap.get('matchId');
    if (current === matchId) {
      return;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { matchId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

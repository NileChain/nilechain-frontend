import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import {
  FactoryContract,
  FactoryService,
} from '../../../core/services/factory/factory.service';
import { WalletService } from '../../../core/services/wallet/wallet.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { AiAssistantContextService } from '../../../core/services/ai-assistant-context.service';
import { resolveApiErrorMessage } from '../../../core/utils/api-error.util';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { ContractActionBarComponent } from '../../../shared/contracts/contract-action-bar/contract-action-bar.component';
import { ContractAttachmentsComponent } from '../../../shared/contracts/contract-attachments/contract-attachments.component';
import { ContractDocumentComponent } from '../../../shared/contracts/contract-document/contract-document.component';
import { ContractReadingProgressComponent } from '../../../shared/contracts/contract-reading-progress/contract-reading-progress.component';
import {
  ContractTocItem,
  buildDocumentToc,
  contractStatusLabelKey,
  parseContractSections,
} from '../../../shared/contracts/contract-text.util';
import {
  toContractDocumentModel,
  documentDirForContract,
} from '../../../shared/contracts/contract-document.mapper';
import { ContractTimelineComponent } from '../../../shared/contracts/contract-timeline/contract-timeline.component';
import { ContractFulfillmentTimelineComponent } from '../../../shared/contracts/contract-fulfillment-timeline/contract-fulfillment-timeline.component';
import { ContractPaymentMilestonesComponent } from '../../../shared/contracts/contract-payment-milestones/contract-payment-milestones.component';
import { ContractDisputesPanelComponent } from '../../../shared/contracts/contract-disputes-panel/contract-disputes-panel.component';
import { ContractReviewPanelComponent } from '../../../shared/contracts/contract-review-panel/contract-review-panel.component';
import { buildContractTimeline } from '../../../shared/contracts/contract-timeline.util';
import { ContractTocComponent } from '../../../shared/contracts/contract-toc/contract-toc.component';
import {
  ContractAttachmentDto,
  ContractAttachmentItem,
  ContractDocumentModel,
  ContractTimelineStep,
} from '../../../shared/contracts/models/contract-document.model';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { ContractIntegrityBadgeComponent } from '../../../shared/contracts/contract-integrity-badge/contract-integrity-badge.component';
import {
  ContractDateAmendmentComponent,
  ContractDateAmendmentState,
} from '../../../shared/contracts/contract-date-amendment/contract-date-amendment.component';
import { ContractRequestChangesComponent } from '../../../shared/contracts/contract-request-changes/contract-request-changes.component';
import { ContractNegotiationDiffComponent } from '../../../shared/contracts/contract-negotiation-diff/contract-negotiation-diff.component';
import { ContractRevisionView } from '../../../shared/contracts/contract-diff.util';

@Component({
  selector: 'app-factory-contract-details',
  standalone: true,
  imports: [
    TranslatePipe,
    RouterLink,
    DecimalPipe,
    AppTopBarComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    ContractDocumentComponent,
    ContractTimelineComponent,
    ContractFulfillmentTimelineComponent,
    ContractPaymentMilestonesComponent,
    ContractDisputesPanelComponent,
    ContractReviewPanelComponent,
    ContractActionBarComponent,
    ContractAttachmentsComponent,
    ContractTocComponent,
    ContractReadingProgressComponent,
    ContractIntegrityBadgeComponent,
    ContractDateAmendmentComponent,
    ContractRequestChangesComponent,
    ContractNegotiationDiffComponent,
  ],
  templateUrl: './factory-contract-details.component.html',
  styleUrl: './factory-contract-details.component.scss',
})
export class FactoryContractDetailsComponent implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly factoryApi = inject(FactoryService);
  private readonly walletApi = inject(WalletService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly assistantCtx = inject(AiAssistantContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly loading = signal(true);
  readonly acting = signal(false);
  readonly uploadingAttachment = signal(false);
  readonly error = signal<string | null>(null);
  readonly contract = signal<ContractDocumentModel | null>(null);
  readonly timeline = signal<ContractTimelineStep[]>([]);
  readonly attachments = signal<ContractAttachmentItem[]>([]);
  readonly toc = signal<ContractTocItem[]>([]);
  readonly activeSectionId = signal<string | null>(null);
  readonly readPercent = signal(0);
  readonly documentReady = signal(false);
  readonly fromMatches = signal(false);
  readonly documentDir = signal<'rtl' | 'ltr'>('ltr');
  readonly availableBalanceEgp = signal<number | null>(null);
  readonly fulfillmentFulfilled = signal(false);
  readonly lastRevision = signal<ContractRevisionView | null>(null);

  readonly signFundsHint = computed(() => {
    const c = this.contract();
    if (!c || !this.canDecide()) {
      return null;
    }
    const qty = c.quantityTons ?? 0;
    const price = c.pricePerTon ?? 0;
    const deal = qty > 0 && price > 0 ? qty * price : null;
    const available = this.availableBalanceEgp();
    if (deal != null && available != null) {
      return this.i18n.instant('factory.contracts.signFundsHint', {
        deal: Math.round(deal).toLocaleString(),
        available: Math.round(available).toLocaleString(),
      });
    }
    return this.i18n.instant('factory.contracts.signFundsHintNoWallet');
  });

  private contractId: string | null = null;
  private viewedAt: string | null = null;
  private raf = 0;
  private readonly reviewThreshold = 92;

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => {
        this.fromMatches.set(q.get('from') === 'matches');
      });

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('contractId');
        this.contractId = id;
        if (id) {
          this.viewedAt = new Date().toISOString();
          this.load(id);
        } else {
          this.loading.set(false);
          this.error.set(
            this.i18n.instant('factory.contracts.detailsMissingId')
          );
        }
      });
  }

  ngAfterViewInit(): void {
    this.queueProgressUpdate();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.queueProgressUpdate();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.queueProgressUpdate();
  }

  load(id: string = this.contractId ?? ''): void {
    if (!id) {
      return;
    }
    this.loading.set(true);
    this.documentReady.set(false);
    this.error.set(null);
    this.factoryApi
      .getContract(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (c) => {
          this.applyContract(c);
          this.loadWalletBalance();
          requestAnimationFrame(() => {
            this.documentReady.set(true);
            this.queueProgressUpdate();
          });
        },
        error: (err) => {
          this.error.set(
            err?.error?.message ||
              this.i18n.instant('factory.contracts.detailsLoadFailed')
          );
        },
      });
  }

  canDecide(): boolean {
    const c = this.contract();
    if (!c) {
      return false;
    }
    // Factory may sign only when the factory has not signed yet.
    if (c.factorySigned) {
      return false;
    }
    const s = (c.status || '').toLowerCase();
    return (
      s === 'pendingsignature' ||
      s === 'pendingfactorysignature' ||
      s === 'draft'
    );
  }

  hasReviewedEnough(): boolean {
    return this.readPercent() >= this.reviewThreshold;
  }

  acceptEnabled(): boolean {
    return !this.canDecide() || this.hasReviewedEnough();
  }

  isSigned(): boolean {
    const c = this.contract();
    if (c?.factorySigned != null && c?.farmSigned != null) {
      return !!c.factorySigned && !!c.farmSigned;
    }
    const s = (c?.status || '').toLowerCase();
    return s === 'signed' || s === 'active';
  }

  dateAmendmentState(): ContractDateAmendmentState | null {
    const c = this.contract();
    if (!c) return null;
    return {
      startsAt: c.startsAt,
      endsAt: c.endsAt,
      hasPendingDateAmendment: c.hasPendingDateAmendment,
      pendingStartsAt: c.pendingStartsAt,
      pendingEndsAt: c.pendingEndsAt,
      dateAmendmentProposedByUserId: c.dateAmendmentProposedByUserId,
      currentUserId: this.auth.currentUser()?.id ?? null,
    };
  }

  canUnwind(): boolean {
    return !!this.contract()?.canUnwindSigned;
  }

  reviewTargetUserId(): string | null {
    return this.contract()?.farmUserId ?? null;
  }

  statusTone(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'signed' || s === 'active' || s === 'completed') return 'success';
    if (s === 'cancelled' || s === 'rejected') return 'danger';
    if (
      s === 'pendingsignature' ||
      s === 'pendingfarmsignature' ||
      s === 'pendingfactorysignature' ||
      s === 'draft'
    ) {
      return 'warning';
    }
    return 'neutral';
  }

  statusLabelKey(status: string): string {
    return contractStatusLabelKey(status);
  }

  shortId(id: string): string {
    return id?.length > 8 ? `${id.slice(0, 8).toUpperCase()}…` : id;
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.activeSectionId.set(id);
  }

  async approve(): Promise<void> {
    if (!this.contractId || !this.canDecide()) {
      return;
    }
    if (!this.hasReviewedEnough()) {
      this.toast.info(
        this.i18n.instant('factory.contracts.reviewBeforeAccept')
      );
      return;
    }
    const ok = await this.confirm.confirm({
      titleKey: 'factory.contracts.confirmApproveTitle',
      bodyKey: 'factory.contracts.confirmApproveBody',
      confirmKey: 'contractDoc.acceptContract',
      cancelKey: 'common.cancel',
    });
    if (!ok) {
      return;
    }
    this.acting.set(true);
    this.factoryApi
      .approveContract(this.contractId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (c) => {
          this.applyContract(c);
          this.toast.success(
            this.i18n.instant(
              c.status?.toLowerCase() === 'signed' ||
                (c.factorySigned && c.farmSigned)
                ? 'factory.contracts.approveSuccessFullySigned'
                : 'factory.contracts.approveSuccess'
            )
          );
          if (this.fromMatches()) {
            setTimeout(() => {
              void this.router.navigate(['/factory/matches']);
            }, 900);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.toast.error(this.resolveApproveError(err));
        },
      });
  }

  private resolveApproveError(err: HttpErrorResponse): string {
    return resolveApiErrorMessage(err, this.i18n, {
      fallbackKey: 'factory.contracts.approveFailed',
      mapCode: (code) => {
        if (code.includes('InsufficientBalance')) {
          return this.i18n.instant('factory.contracts.approveInsufficientBalance');
        }
        if (code.includes('DealValueInvalid')) {
          return this.i18n.instant('factory.contracts.approveDealValueInvalid');
        }
        return null;
      },
    }).message;
  }

  private loadWalletBalance(): void {
    this.walletApi.getMine().subscribe({
      next: (w) => this.availableBalanceEgp.set(w.availableBalanceEgp),
      error: () => this.availableBalanceEgp.set(null),
    });
  }

  async unwind(): Promise<void> {
    if (!this.contractId || !this.canUnwind()) {
      return;
    }
    const ok = await this.confirm.confirm({
      titleKey: 'factory.contracts.confirmUnwindTitle',
      bodyKey: 'factory.contracts.confirmUnwindBody',
      confirmKey: 'contractDoc.unwindSigned',
      cancelKey: 'common.cancel',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.acting.set(true);
    this.factoryApi
      .rejectContract(this.contractId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (c) => {
          this.applyContract(c);
          this.toast.info(this.i18n.instant('factory.contracts.unwindSuccess'));
        },
        error: (err: HttpErrorResponse) => {
          this.toast.error(
            err?.error?.message ||
              this.i18n.instant('factory.contracts.unwindFailed')
          );
        },
      });
  }

  async reject(): Promise<void> {
    if (!this.contractId || !this.canDecide()) {
      return;
    }
    const ok = await this.confirm.confirm({
      titleKey: 'factory.contracts.confirmRejectTitle',
      bodyKey: 'factory.contracts.confirmRejectBody',
      confirmKey: 'contractDoc.rejectContract',
      cancelKey: 'common.cancel',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.acting.set(true);
    this.factoryApi
      .rejectContract(this.contractId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (c) => {
          this.applyContract(c);
          this.toast.info(this.i18n.instant('factory.contracts.rejectSuccess'));
          if (this.fromMatches()) {
            setTimeout(() => {
              void this.router.navigate(['/factory/matches']);
            }, 700);
          }
        },
        error: (err) => {
          this.toast.error(
            err?.error?.message ||
              this.i18n.instant('factory.contracts.rejectFailed')
          );
        },
      });
  }

  downloadPdf(): void {
    if (!this.contractId) {
      return;
    }
    this.acting.set(true);
    this.factoryApi
      .downloadContractPdf(this.contractId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nilechain-contract-${this.contractId}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          this.toast.success(
            this.i18n.instant('factory.contracts.downloadSuccess')
          );
        },
        error: () =>
          this.toast.error(
            this.i18n.instant('factory.contracts.downloadFailed')
          ),
      });
  }

  /** Opens the legal-document PDF (not the website print view). */
  print(): void {
    if (!this.contractId) {
      return;
    }
    this.acting.set(true);
    this.factoryApi
      .downloadContractPdf(this.contractId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const win = window.open(url, '_blank');
          if (win) {
            win.addEventListener(
              'load',
              () => {
                win.focus();
                win.print();
              },
              { once: true }
            );
          } else {
            const a = document.createElement('a');
            a.href = url;
            a.download = `nilechain-contract-${this.contractId}.pdf`;
            a.click();
          }
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        },
        error: () =>
          this.toast.error(
            this.i18n.instant('factory.contracts.downloadFailed')
          ),
      });
  }

  async share(): Promise<void> {
    const url = window.location.href;
    const title = this.i18n.instant('contractDoc.defaultTitle');
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      this.toast.success(this.i18n.instant('contractDoc.shareCopied'));
    } catch {
      this.toast.info(url);
    }
  }

  backToList(): void {
    void this.router.navigate(['/factory/contracts']);
  }

  onUploadAttachment(event: { file: File; kind: string }): void {
    if (!this.contractId || this.uploadingAttachment()) {
      return;
    }
    this.uploadingAttachment.set(true);
    this.factoryApi
      .uploadContractAttachment(this.contractId, event.file, event.kind)
      .pipe(finalize(() => this.uploadingAttachment.set(false)))
      .subscribe({
        next: () => {
          this.loadAttachments(this.contractId!);
          this.toast.success(
            this.i18n.instant('contractDoc.uploadAttachment')
          );
        },
        error: (err) =>
          this.toast.error(
            err?.error?.message ||
              this.i18n.instant('factory.contracts.detailsLoadFailed')
          ),
      });
  }

  onRemoveAttachment(attachmentId: string): void {
    if (!this.contractId) {
      return;
    }
    this.factoryApi
      .deleteContractAttachment(this.contractId, attachmentId)
      .subscribe({
        next: () => {
          this.attachments.update((list) =>
            list.filter((a) => a.id !== attachmentId)
          );
          this.toast.info(this.i18n.instant('contractDoc.deleteAttachment'));
        },
        error: (err) =>
          this.toast.error(
            err?.error?.message ||
              this.i18n.instant('factory.contracts.detailsLoadFailed')
          ),
      });
  }

  private applyContract(c: FactoryContract): void {
    this.assistantCtx.set({
      contractId: c.contractId,
      matchId: c.matchId,
    });
    this.lastRevision.set(
      c.lastRevision
        ? {
            ...c.lastRevision,
            newText: c.lastRevision.newText || c.generatedText || '',
          }
        : null
    );
    const model = toContractDocumentModel({
      ...c,
      factoryLocation: c.deliveryLocation ?? null,
      farmLocation: c.farmLocation ?? null,
    });
    const sections = parseContractSections(model.generatedText);
    this.contract.set(model);
    this.documentDir.set(documentDirForContract(model));
    this.toc.set(
      buildDocumentToc(sections, {
        parties: this.i18n.instant('contractDoc.parties'),
        commercial: this.i18n.instant('contractDoc.commercialTerms'),
        signatures: this.i18n.instant('contractDoc.signatures'),
      })
    );
    this.timeline.set(
      buildContractTimeline(model, { viewedAt: this.viewedAt })
    );
    this.activeSectionId.set('sec-parties');
    this.loadAttachments(c.contractId);
    this.loadFulfillment(c.contractId);
  }

  private loadFulfillment(contractId: string): void {
    this.factoryApi.getFulfillment(contractId).subscribe({
      next: (f) =>
        this.fulfillmentFulfilled.set(
          (f.status || '').toLowerCase() === 'fulfilled'
        ),
      error: () => this.fulfillmentFulfilled.set(false),
    });
  }

  private loadAttachments(contractId: string): void {
    this.factoryApi.listContractAttachments(contractId).subscribe({
      next: (items) =>
        this.attachments.set(
          (items ?? []).map((dto) => this.mapAttachment(dto))
        ),
      error: () => this.attachments.set([]),
    });
  }

  private mapAttachment(dto: ContractAttachmentDto): ContractAttachmentItem {
    const userId = this.auth.currentUser()?.id;
    const fullySigned = this.isSigned();
    return {
      id: dto.attachmentId,
      name: dto.fileName,
      sizeLabel: this.formatBytes(dto.fileSize),
      typeLabel: dto.contentType || dto.kind || '—',
      kind: dto.kind,
      url: dto.fileUrl,
      canDelete:
        !!userId &&
        dto.uploadedByUserId === userId &&
        !fullySigned,
      icon: this.iconForContentType(dto.contentType, dto.fileName),
    };
  }

  private formatBytes(bytes: number): string {
    if (!bytes || bytes < 0) {
      return '';
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private iconForContentType(contentType: string, fileName: string): string {
    const ct = (contentType || '').toLowerCase();
    const name = (fileName || '').toLowerCase();
    if (ct.includes('pdf') || name.endsWith('.pdf')) {
      return 'picture_as_pdf';
    }
    if (ct.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/.test(name)) {
      return 'image';
    }
    return 'attach_file';
  }

  private queueProgressUpdate(): void {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.updateReadingProgress());
  }

  private updateReadingProgress(): void {
    const paper = this.host.nativeElement.querySelector(
      '#contract-print-root'
    ) as HTMLElement | null;
    if (!paper) {
      this.readPercent.set(0);
      return;
    }

    const rect = paper.getBoundingClientRect();
    const viewport = window.innerHeight || 1;
    if (paper.scrollHeight <= viewport + 48 || rect.bottom <= viewport + 32) {
      this.readPercent.set(100);
    } else {
      const total = Math.max(paper.scrollHeight - viewport, 1);
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const pct = Math.round((scrolled / total) * 100);
      this.readPercent.set(Math.max(0, Math.min(100, pct)));
    }

    const sections = this.toc();
    if (!sections.length) {
      return;
    }
    let current = sections[0].id;
    for (const item of sections) {
      const el = document.getElementById(item.id);
      if (!el) {
        continue;
      }
      const top = el.getBoundingClientRect().top;
      if (top <= viewport * 0.28) {
        current = item.id;
      }
    }
    this.activeSectionId.set(current);
  }
}

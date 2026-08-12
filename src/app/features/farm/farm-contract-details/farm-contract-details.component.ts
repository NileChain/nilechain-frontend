import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { ContractDocumentComponent } from '../../../shared/contracts/contract-document/contract-document.component';
import { ContractTimelineComponent } from '../../../shared/contracts/contract-timeline/contract-timeline.component';
import { ContractFulfillmentTimelineComponent } from '../../../shared/contracts/contract-fulfillment-timeline/contract-fulfillment-timeline.component';
import { ContractPaymentMilestonesComponent } from '../../../shared/contracts/contract-payment-milestones/contract-payment-milestones.component';
import { ContractDisputesPanelComponent } from '../../../shared/contracts/contract-disputes-panel/contract-disputes-panel.component';
import { ContractReviewPanelComponent } from '../../../shared/contracts/contract-review-panel/contract-review-panel.component';
import { ContractActionBarComponent } from '../../../shared/contracts/contract-action-bar/contract-action-bar.component';
import { ContractAttachmentsComponent } from '../../../shared/contracts/contract-attachments/contract-attachments.component';
import { ContractTocComponent } from '../../../shared/contracts/contract-toc/contract-toc.component';
import { ContractReadingProgressComponent } from '../../../shared/contracts/contract-reading-progress/contract-reading-progress.component';
import { ContractIntegrityBadgeComponent } from '../../../shared/contracts/contract-integrity-badge/contract-integrity-badge.component';
import { FarmService } from '../../../core/services/farm/farm.service';
import { FarmContract } from '../../../core/models/farm/farm-contract.model';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { AiAssistantContextService } from '../../../core/services/ai-assistant-context.service';
import {
  ContractAttachmentDto,
  ContractAttachmentItem,
  ContractDocumentModel,
  ContractTimelineStep,
} from '../../../shared/contracts/models/contract-document.model';
import { buildContractTimeline } from '../../../shared/contracts/contract-timeline.util';
import {
  ContractTocItem,
  buildToc,
  contractStatusLabelKey,
  detectDocumentDir,
  displayText,
  parseContractSections,
} from '../../../shared/contracts/contract-text.util';

@Component({
  selector: 'app-farm-contract-details',
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
  ],
  templateUrl: './farm-contract-details.component.html',
  styleUrl: './farm-contract-details.component.scss',
})
export class FarmContractDetailsComponent implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly farmApi = inject(FarmService);
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
  readonly fulfillmentFulfilled = signal(false);

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

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('contractId');
      this.contractId = id;
      if (id) {
        this.viewedAt = new Date().toISOString();
        this.load(id);
      } else {
        this.loading.set(false);
        this.error.set(this.i18n.instant('farm.contracts.detailsMissingId'));
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
    this.farmApi
      .getContract(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (c) => {
          this.applyContract(c);
          // Defer heavy body paint slightly for smoother transition.
          requestAnimationFrame(() => {
            this.documentReady.set(true);
            this.queueProgressUpdate();
          });
        },
        error: (err) => {
          this.error.set(
            err?.error?.message ||
              this.i18n.instant('farm.contracts.detailsLoadFailed')
          );
        },
      });
  }

  canDecide(): boolean {
    const c = this.contract();
    if (!c) {
      return false;
    }
    // Farm may sign only when the farm has not signed yet.
    if (c.farmSigned) {
      return false;
    }
    const s = (c.status || '').toLowerCase();
    return (
      s === 'pendingsignature' ||
      s === 'pendingfarmsignature' ||
      s === 'draft'
    );
  }

  hasReviewedEnough(): boolean {
    // Short contracts: once the paper is in view and progress advances, unlock.
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

  canUnwind(): boolean {
    return !!this.contract()?.canUnwindSigned;
  }

  reviewTargetUserId(): string | null {
    return this.contract()?.factoryUserId ?? null;
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
      this.toast.info(this.i18n.instant('farm.contracts.reviewBeforeAccept'));
      return;
    }
    const ok = await this.confirm.confirm({
      titleKey: 'farm.contracts.confirmApproveTitle',
      bodyKey: 'farm.contracts.confirmApproveBody',
      confirmKey: 'contractDoc.acceptContract',
      cancelKey: 'common.cancel',
    });
    if (!ok) {
      return;
    }
    this.acting.set(true);
    this.farmApi
      .approveContract(this.contractId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (c) => {
          this.applyContract(c);
          const fullySigned =
            c.status?.toLowerCase() === 'signed' ||
            (!!c.factorySigned && !!c.farmSigned);
          this.toast.success(
            this.i18n.instant(
              fullySigned
                ? 'farm.contracts.approveSuccessFullySigned'
                : 'farm.contracts.approveSuccess'
            )
          );
          if (this.fromMatches()) {
            // Soft nudge back to matches after signing.
            setTimeout(() => {
              void this.router.navigate(['/farm/matches']);
            }, 900);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.toast.error(this.resolveApproveError(err));
        },
      });
  }

  private resolveApproveError(err: HttpErrorResponse): string {
    const code = err?.error?.code;
    if (typeof code === 'string') {
      if (code.includes('InsufficientBalance')) {
        return this.i18n.instant('farm.contracts.approveInsufficientBalance');
      }
      if (code.includes('DealValueInvalid')) {
        return this.i18n.instant('farm.contracts.approveDealValueInvalid');
      }
    }
    return (
      err?.error?.message || this.i18n.instant('farm.contracts.approveFailed')
    );
  }

  async unwind(): Promise<void> {
    if (!this.contractId || !this.canUnwind()) {
      return;
    }
    const ok = await this.confirm.confirm({
      titleKey: 'farm.contracts.confirmUnwindTitle',
      bodyKey: 'farm.contracts.confirmUnwindBody',
      confirmKey: 'contractDoc.unwindSigned',
      cancelKey: 'common.cancel',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.acting.set(true);
    this.farmApi
      .rejectContract(this.contractId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (c) => {
          this.applyContract(c);
          this.toast.info(this.i18n.instant('farm.contracts.unwindSuccess'));
        },
        error: (err: HttpErrorResponse) => {
          this.toast.error(
            err?.error?.message ||
              this.i18n.instant('farm.contracts.unwindFailed')
          );
        },
      });
  }

  async reject(): Promise<void> {
    if (!this.contractId || !this.canDecide()) {
      return;
    }
    const ok = await this.confirm.confirm({
      titleKey: 'farm.contracts.confirmRejectTitle',
      bodyKey: 'farm.contracts.confirmRejectBody',
      confirmKey: 'contractDoc.rejectContract',
      cancelKey: 'common.cancel',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.acting.set(true);
    this.farmApi
      .rejectContract(this.contractId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (c) => {
          this.applyContract(c);
          this.toast.info(this.i18n.instant('farm.contracts.rejectSuccess'));
          if (this.fromMatches()) {
            setTimeout(() => {
              void this.router.navigate(['/farm/matches']);
            }, 700);
          }
        },
        error: (err) => {
          this.toast.error(
            err?.error?.message ||
              this.i18n.instant('farm.contracts.rejectFailed')
          );
        },
      });
  }

  downloadPdf(): void {
    if (!this.contractId) {
      return;
    }
    this.acting.set(true);
    this.farmApi
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
          this.toast.success(this.i18n.instant('farm.contracts.downloadSuccess'));
        },
        error: () =>
          this.toast.error(this.i18n.instant('farm.contracts.downloadFailed')),
      });
  }

  print(): void {
    window.print();
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
    void this.router.navigate(['/farm/contracts']);
  }

  onUploadAttachment(event: { file: File; kind: string }): void {
    if (!this.contractId || this.uploadingAttachment()) {
      return;
    }
    this.uploadingAttachment.set(true);
    this.farmApi
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
              this.i18n.instant('farm.contracts.detailsLoadFailed')
          ),
      });
  }

  onRemoveAttachment(attachmentId: string): void {
    if (!this.contractId) {
      return;
    }
    this.farmApi
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
              this.i18n.instant('farm.contracts.detailsLoadFailed')
          ),
      });
  }

  private applyContract(c: FarmContract): void {
    this.assistantCtx.set({
      contractId: c.contractId,
      matchId: c.matchId,
    });
    const model: ContractDocumentModel = {
      contractId: c.contractId,
      matchId: c.matchId,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt ?? c.signedAt ?? c.createdAt,
      signedAt: c.signedAt,
      factorySigned: c.factorySigned ?? false,
      farmSigned: c.farmSigned ?? false,
      factorySignedAt: c.factorySignedAt ?? null,
      farmSignedAt: c.farmSignedAt ?? null,
      factoryName: displayText(c.factoryName, '—'),
      farmName: displayText(c.farmName, '—'),
      factoryLocation: displayText(c.factoryLocation, ''),
      cropName: displayText(c.cropName, '—'),
      quantityTons: c.quantityTons,
      pricePerTon: c.pricePerTon,
      deliveryDate: c.deliveryDate,
      deliveryLocation: displayText(
        c.deliveryLocation ?? c.factoryLocation,
        ''
      ),
      generatedText: c.generatedText,
      pdfUrl: c.pdfUrl,
      version: '1.0',
      title: undefined,
      matchScore: c.matchScore,
      riskScore: c.riskScore,
      farmUserId: c.farmUserId ?? null,
      factoryUserId: c.factoryUserId ?? null,
      canUnwindSigned: !!c.canUnwindSigned,
      integrity: c.integrity ?? null,
    };
    const sections = parseContractSections(model.generatedText);
    this.contract.set(model);
    this.documentDir.set(detectDocumentDir(model.generatedText));
    this.toc.set(buildToc(sections));
    this.timeline.set(
      buildContractTimeline(model, { viewedAt: this.viewedAt })
    );
    this.activeSectionId.set(sections[0]?.id ?? null);
    this.loadAttachments(c.contractId);
    this.loadFulfillment(c.contractId);
  }

  private loadFulfillment(contractId: string): void {
    this.farmApi.getFulfillment(contractId).subscribe({
      next: (f) =>
        this.fulfillmentFulfilled.set(
          (f.status || '').toLowerCase() === 'fulfilled'
        ),
      error: () => this.fulfillmentFulfilled.set(false),
    });
  }

  private loadAttachments(contractId: string): void {
    this.farmApi.listContractAttachments(contractId).subscribe({
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
    // Document fits / bottom reached → treated as fully reviewed.
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

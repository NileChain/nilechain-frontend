import { UiDatePipe } from '../../../core/pipes/ui-date.pipe';
import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { FactorySupplyRequestDetail } from '../../../core/models/factory/factory-dashboard.model';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { LocaleService } from '../../../core/services/locale.service';
import { geographicScopeLabelKey } from '../../../core/i18n/status-i18n.util';
import { governorateLabel } from '../../../shared/geo/egypt-governorates';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-factory-request-details',
  standalone: true,
  imports: [
    UiDatePipe, TranslatePipe,
    AppTopBarComponent,
    UiErrorStateComponent,
    UiLoaderComponent,
    UiSkeletonComponent,
    RouterLink,
    DecimalPipe,
  ],
  templateUrl: './factory-request-details.component.html',
})
export class FactoryRequestDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly factoryService = inject(FactoryService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly locale = inject(LocaleService);

  readonly loading = signal(true);
  readonly acting = signal(false);
  readonly error = signal<string | null>(null);
  readonly request = signal<FactorySupplyRequestDetail | null>(null);
  readonly requestId = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('requestId');
      this.requestId.set(id);
      if (id) {
        this.load(id);
      } else {
        this.error.set(this.i18n.instant('factory.requests.missingId'));
        this.loading.set(false);
      }
    });
  }

  load(requestId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.factoryService
      .getRequest(requestId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.request.set(detail),
        error: () =>
          this.error.set(this.i18n.instant('factory.requests.loadDetailFailed')),
      });
  }

  shortId(id: string): string {
    if (!id) return '—';
    const clean = id.replace(/-/g, '');
    return clean.length > 8 ? `#${clean.slice(0, 8).toUpperCase()}` : `#${clean.toUpperCase()}`;
  }

  budget(detail: FactorySupplyRequestDetail): number | null {
    if (detail.pricePerTon == null) return null;
    return detail.pricePerTon * detail.quantityTons;
  }

  statusKey(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 'factory.requests.statusPending';
    if (s === 'matched') return 'factory.requests.statusMatched';
    if (s === 'fulfilled') return 'factory.requests.statusFulfilled';
    if (s === 'cancelled') return 'factory.requests.statusCancelled';
    return 'factory.requests.statusUnknown';
  }

  async cancel(): Promise<void> {
    const detail = this.request();
    if (!detail?.canCancel) return;

    const ok = await this.confirm.confirm({
      titleKey: 'factory.requests.cancelTitle',
      bodyKey: 'factory.requests.cancelBody',
      confirmKey: 'factory.requests.cancelConfirm',
      cancelKey: 'common.cancel',
    });
    if (!ok) return;

    this.acting.set(true);
    this.factoryService
      .cancelRequest(detail.requestId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success(this.i18n.instant('factory.requests.cancelSuccess'));
          this.load(detail.requestId);
        },
        error: () =>
          this.toast.error(this.i18n.instant('factory.requests.cancelFailed')),
      });
  }

  rerunAgent(): void {
    const detail = this.request();
    if (!detail?.canRerunAgent) return;
    void this.router.navigate(['/factory/agent-progress'], {
      queryParams: { requestId: detail.requestId },
    });
  }

  formatGovernorates(names: string[]): string {
    const loc = this.locale.locale();
    const sep = loc === 'ar' ? '، ' : ', ';
    return names.map((n) => governorateLabel(n, loc) || n).join(sep);
  }

  geographicScopeKey(scope: string): string {
    return geographicScopeLabelKey(scope);
  }

  changeGeoScope(scope: string): void {
    const detail = this.request();
    if (!detail?.canUpdateGeoScope || !scope) return;
    this.acting.set(true);
    this.factoryService
      .updateGeoScope(detail.requestId, {
        geographicScope: scope,
        selectedGovernorates: detail.quality?.preferredGovernorates,
      })
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (updated) => {
          this.request.set(updated);
          this.toast.success(this.i18n.instant('factory.requests.scopeUpdated'));
        },
        error: (err) =>
          this.toast.error(
            err?.error?.detail ||
              err?.error?.message ||
              this.i18n.instant('factory.requests.scopeFailed')
          ),
      });
  }

  showMore(): void {
    const detail = this.request();
    if (!detail?.canShowMoreMatches) return;
    this.acting.set(true);
    this.factoryService
      .showMoreMatches(detail.requestId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (updated) => {
          this.request.set(updated);
          this.toast.success(this.i18n.instant('factory.progress.showMoreAccepted'));
          this.rerunAgent();
        },
        error: (err) =>
          this.toast.error(
            err?.error?.detail ||
              err?.error?.message ||
              this.i18n.instant('factory.progress.showMoreFailed')
          ),
      });
  }
}

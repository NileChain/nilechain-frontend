import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, catchError, finalize, of } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import {
  AdminService,
  FarmHygiene,
  FactoryHygiene,
  KybScoreFactor,
  VerifyUserResult,
} from '../../../core/services/admin/admin.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { TranslateService } from '../../../core/services/translate.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  AdminUser,
  CreateUserRequest,
} from '../../../core/models/admin/admin-user.model';
import { CertificationCatalogItem } from '../../../core/models/farm/farm-profile.model';

export interface ReviewHygiene {
  kind: 'farm' | 'factory';
  entityId: string;
  name: string;
  isVerified: boolean;
  kybIncomplete: boolean;
  missingKybKinds: string[];
  documents: FarmHygiene['documents'];
  certifications?: FarmHygiene['certifications'];
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    TranslatePipe,
    UiErrorStateComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    AppTopBarComponent,
    FormsModule,
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  readonly trustThreshold = 70;

  private readonly adminService = inject(AdminService);
  private readonly farmService = inject(FarmService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly i18n = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly actionLoading = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly users = signal<AdminUser[]>([]);
  readonly totalCount = signal(0);
  readonly totalPages = signal(1);
  readonly showCreate = signal(false);

  page = 1;
  pageSize = 10;
  search = '';
  roleFilter = '';
  /** pending = unverified queue (default), verified, all */
  verifiedFilter: 'pending' | 'verified' | 'all' = 'pending';

  createEmail = '';
  createPassword = '';
  createConfirm = '';
  createRole = 'Farm';
  createName = '';

  readonly expandedUserId = signal<string | null>(null);
  readonly menuUserId = signal<string | null>(null);
  readonly hygiene = signal<ReviewHygiene | null>(null);
  readonly hygieneLoading = signal(false);
  readonly certCatalog = signal<CertificationCatalogItem[]>([]);
  grantCertId = '';
  grantExpiresAt = '';
  decisionNote = '';

  readonly verificationResults = signal<Record<string, VerifyUserResult>>({});

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap.get('isVerified');
    if (q === 'true') {
      this.verifiedFilter = 'verified';
    } else if (q === 'false' || q == null) {
      this.verifiedFilter = 'pending';
    }
    this.loadUsers();
    this.farmService.getCertificationCatalog().subscribe({
      next: (items) => this.certCatalog.set(items ?? []),
    });
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    const isVerified =
      this.verifiedFilter === 'pending'
        ? false
        : this.verifiedFilter === 'verified'
          ? true
          : null;
    this.adminService
      .getUsers({
        page: this.page,
        pageSize: this.pageSize,
        search: this.search || null,
        role: this.roleFilter || null,
        isVerified,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          this.users.set(result.items);
          this.totalCount.set(result.totalCount);
          this.totalPages.set(result.totalPages || 1);
          this.seedReports(result.items);
        },
        error: () =>
          this.error.set(this.i18n.instant('admin.users.loadFailed')),
      });
  }

  setRoleFilter(role: string): void {
    this.roleFilter = role;
    this.page = 1;
    this.loadUsers();
  }

  setVerifiedFilter(filter: 'pending' | 'verified' | 'all'): void {
    this.verifiedFilter = filter;
    this.page = 1;
    this.loadUsers();
  }

  searchUsers(): void {
    this.page = 1;
    this.loadUsers();
  }

  prevPage(): void {
    if (this.page <= 1) {
      return;
    }
    this.page -= 1;
    this.loadUsers();
  }

  nextPage(): void {
    if (this.page >= this.totalPages()) {
      return;
    }
    this.page += 1;
    this.loadUsers();
  }

  displayName(user: AdminUser): string {
    return user.displayName || user.farmName || user.factoryName || user.email;
  }

  initial(user: AdminUser): string {
    return this.displayName(user).charAt(0).toUpperCase();
  }

  hasKybProfile(user: AdminUser): boolean {
    return !!user.farmId || !!user.factoryId;
  }

  needsKybDecision(user: AdminUser): boolean {
    if (user.isVerified || !this.hasKybProfile(user)) {
      return false;
    }
    const status = (user.kybReviewStatus || '').toLowerCase();
    return status !== 'rejected' && status !== 'approved';
  }

  reviewStatusKey(user: AdminUser): string {
    const status = (user.kybReviewStatus || '').toLowerCase();
    if (user.isVerified || status === 'approved') {
      return 'admin.users.statusApproved';
    }
    if (status === 'requestinfo') {
      return 'admin.users.statusRequestInfo';
    }
    if (status === 'rejected') {
      return 'admin.users.statusRejected';
    }
    return 'common.pending';
  }

  statusTone(user: AdminUser): 'ok' | 'wait' | 'warn' | 'bad' {
    const status = (user.kybReviewStatus || '').toLowerCase();
    if (user.isVerified || status === 'approved') return 'ok';
    if (status === 'rejected') return 'bad';
    if (status === 'requestinfo') return 'warn';
    return 'wait';
  }

  trustScore(user: AdminUser): number | null {
    return this.verificationFor(user)?.trustScore ?? user.lastTrustScore ?? null;
  }

  isProPlan(user: AdminUser): boolean {
    const code = (user.planCode || '').toLowerCase();
    return code === 'farm.pro' || code === 'factory.pro';
  }

  async grantPro(user: AdminUser): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      titleKey: 'admin.users.confirmGrantProTitle',
      bodyKey: 'admin.users.confirmGrantProBody',
    });
    if (!ok) return;
    const planCode = user.role === 'Farm' ? 'farm.pro' : 'factory.pro';
    this.runAction(
      user.id,
      'grantPro',
      () => this.adminService.setUserSubscription(user.id, planCode),
      'admin.users.planGranted'
    );
  }

  async revokePro(user: AdminUser): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      titleKey: 'admin.users.confirmRevokeProTitle',
      bodyKey: 'admin.users.confirmRevokeProBody',
      danger: true,
    });
    if (!ok) return;
    const planCode = user.role === 'Farm' ? 'farm.free' : 'factory.free';
    this.runAction(
      user.id,
      'revokePro',
      () => this.adminService.setUserSubscription(user.id, planCode),
      'admin.users.planRevoked'
    );
  }

  scoreTone(score: number): 'ok' | 'warn' | 'bad' {
    if (score >= this.trustThreshold) return 'ok';
    if (score >= 40) return 'warn';
    return 'bad';
  }

  toggleMenu(userId: string, event: Event): void {
    event.stopPropagation();
    this.menuUserId.update((id) => (id === userId ? null : userId));
  }

  @HostListener('document:click')
  closeMenu(): void {
    if (this.menuUserId()) {
      this.menuUserId.set(null);
    }
  }

  checklist(
    hygiene: ReviewHygiene,
    user: AdminUser
  ): {
    kind: string;
    provided: boolean;
    score: number | null;
    factors: KybScoreFactor[];
  }[] {
    const report = this.verificationFor(user);
    if (report?.comparison?.length) {
      return report.comparison.map((item) => ({
        kind: item.kybKind,
        provided: item.provided,
        score: item.kindTrustScore,
        factors: item.factors ?? [],
      }));
    }
    const missing = new Set(
      (hygiene.missingKybKinds ?? []).map((kind) => kind.toLowerCase())
    );
    const kinds = [
      ...new Set([
        ...hygiene.documents.map((doc) => doc.kybKind),
        ...hygiene.missingKybKinds,
      ]),
    ];
    return kinds.map((kind) => ({
      kind,
      provided: !missing.has(kind.toLowerCase()),
      score: null,
      factors: [],
    }));
  }

  /** Older reports were stored before factors existed, so an unknown code shows as-is. */
  factorLabel(code: string): string {
    const key = `admin.users.kybFactor.${code}`;
    const label = this.i18n.instant(key);
    return label === key ? code : label;
  }

  factorDelta(delta: number): string {
    return delta > 0 ? `+${delta}` : `${delta}`;
  }

  factorTone(delta: number): 'ok' | 'warn' | 'neutral' {
    if (delta > 0) return 'ok';
    if (delta < 0) return 'warn';
    return 'neutral';
  }

  recommendationKey(value?: string | null): string {
    const rec = (value || '').toLowerCase();
    if (rec === 'approve') return 'admin.users.recApprove';
    if (rec === 'reject') return 'admin.users.recReject';
    return 'admin.users.recNeedsReview';
  }

  analyze(user: AdminUser): void {
    this.actionLoading.set(`analyze:${user.id}`);
    this.error.set(null);
    this.adminService
      .analyzeKyb(user.id)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: (res) => {
          if (res) {
            this.storeReport(user.id, res);
          }
          this.toast.info(this.i18n.instant('admin.users.analyzed'));
          this.loadUsers();
          if (this.expandedUserId() === user.id) {
            this.loadHygiene(user);
          }
        },
        error: (err) => {
          this.error.set(
            err?.error?.message ||
              err?.error?.error ||
              this.i18n.instant('admin.users.actionFailed', { action: 'analyze' })
          );
        },
      });
  }

  async approve(user: AdminUser): Promise<void> {
    const report = this.verificationFor(user);
    const lowScore =
      (report?.trustScore ?? user.lastTrustScore ?? 0) < this.trustThreshold;
    const confirmed = await this.confirmDialog.confirm({
      titleKey: lowScore
        ? 'admin.users.confirmApproveOverrideTitle'
        : 'admin.users.confirmApproveTitle',
      bodyKey: lowScore
        ? 'admin.users.confirmApproveOverrideBody'
        : 'admin.users.confirmApproveBody',
      confirmKey: 'admin.users.approve',
      cancelKey: 'common.cancel',
      danger: lowScore,
      promptKey: lowScore ? 'admin.users.decisionNote' : 'admin.users.decisionNoteOptional',
      promptRequired: lowScore,
      initialPrompt: this.decisionNote,
    });
    if (!confirmed) {
      return;
    }
    const reason = this.confirmDialog.takePrompt();
    this.decisionNote = reason;
    this.runAction(
      user.id,
      'approve',
      () => this.adminService.approveUser(user.id, reason || null),
      'admin.users.approvedEmailSent'
    );
  }

  async requestInfo(user: AdminUser): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'admin.users.confirmRequestInfoTitle',
      bodyKey: 'admin.users.confirmRequestInfoBody',
      confirmKey: 'admin.users.requestInfo',
      cancelKey: 'common.cancel',
      danger: false,
      promptKey: 'admin.users.decisionNote',
      promptRequired: true,
      initialPrompt: this.decisionNote,
    });
    if (!confirmed) {
      return;
    }
    const reason = this.confirmDialog.takePrompt();
    if (!reason) {
      this.toast.error(this.i18n.instant('admin.users.reasonRequired'));
      return;
    }
    this.decisionNote = reason;
    this.runAction(
      user.id,
      'request-info',
      () => this.adminService.requestKybInfo(user.id, reason),
      'admin.users.requestInfoEmailSent'
    );
  }

  async reject(user: AdminUser): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'admin.users.confirmRejectTitle',
      bodyKey: 'admin.users.confirmRejectBody',
      confirmKey: 'admin.users.rejectKyb',
      cancelKey: 'common.cancel',
      danger: true,
      promptKey: 'admin.users.decisionNote',
      promptRequired: true,
      initialPrompt: this.decisionNote,
    });
    if (!confirmed) {
      return;
    }
    const reason = this.confirmDialog.takePrompt();
    if (!reason) {
      this.toast.error(this.i18n.instant('admin.users.reasonRequired'));
      return;
    }
    this.decisionNote = reason;
    this.runAction(
      user.id,
      'reject',
      () => this.adminService.rejectUser(user.id, reason),
      'admin.users.rejectedEmailSent'
    );
  }

  verificationFor(user: AdminUser): VerifyUserResult | null {
    return this.verificationResults()[user.id] ?? null;
  }

  toggleHygiene(user: AdminUser): void {
    if (!this.hasKybProfile(user)) return;
    this.menuUserId.set(null);
    if (this.expandedUserId() === user.id) {
      this.expandedUserId.set(null);
      this.hygiene.set(null);
      this.decisionNote = '';
      return;
    }
    this.expandedUserId.set(user.id);
    this.decisionNote = user.kybAdminNote ?? '';
    this.loadHygiene(user);
    this.ensureReport(user);
  }

  loadHygiene(user: AdminUser): void {
    this.hygieneLoading.set(true);
    this.hygiene.set(null);
    const request$: Observable<FarmHygiene | FactoryHygiene | null> = user.farmId
      ? this.adminService.getFarmHygiene(user.farmId)
      : user.factoryId
        ? this.adminService.getFactoryHygiene(user.factoryId)
        : of(null);

    request$.pipe(finalize(() => this.hygieneLoading.set(false))).subscribe({
      next: (h: FarmHygiene | FactoryHygiene | null) => {
        if (!h) return;
        this.hygiene.set(this.mapHygiene(h));
      },
      error: () =>
        this.error.set(this.i18n.instant('admin.users.hygieneLoadFailed')),
    });
  }

  grantCert(farmId: string): void {
    if (!this.grantCertId) return;
    this.actionLoading.set(`grant:${farmId}`);
    this.adminService
      .grantFarmCertification(farmId, {
        certificationId: this.grantCertId,
        expiresAt: this.grantExpiresAt || null,
      })
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.grantCertId = '';
          this.grantExpiresAt = '';
          this.toast.success(this.i18n.instant('admin.users.certGranted'));
          const user = this.users().find((u) => u.farmId === farmId);
          if (user) this.loadHygiene(user);
        },
        error: () =>
          this.toast.error(this.i18n.instant('admin.users.certGrantFailed')),
      });
  }

  revokeCert(farmId: string, certificationId: string): void {
    this.actionLoading.set(`revoke:${certificationId}`);
    this.adminService
      .revokeFarmCertification(farmId, certificationId)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.toast.success(this.i18n.instant('admin.users.certRevoked'));
          const user = this.users().find((u) => u.farmId === farmId);
          if (user) this.loadHygiene(user);
        },
        error: () =>
          this.toast.error(this.i18n.instant('admin.users.certRevokeFailed')),
      });
  }

  kybLabel(kind: string): string {
    return this.i18n.instant(`register.kyb.${kind}`);
  }

  async block(user: AdminUser): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'admin.users.confirmBlockTitle',
      bodyKey: 'admin.users.confirmBlockBody',
      confirmKey: 'admin.users.block',
      cancelKey: 'common.cancel',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.runAction(user.id, 'block', () =>
      this.adminService.blockUser(user.id)
    );
  }

  unblock(user: AdminUser): void {
    this.runAction(user.id, 'unblock', () =>
      this.adminService.unblockUser(user.id)
    );
  }

  async deactivate(user: AdminUser): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'admin.users.confirmDeactivateTitle',
      bodyKey: 'admin.users.confirmDeactivateBody',
      confirmKey: 'admin.users.deactivate',
      cancelKey: 'common.cancel',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.runAction(user.id, 'deactivate', () =>
      this.adminService.deactivateUser(user.id)
    );
  }

  reactivate(user: AdminUser): void {
    this.runAction(user.id, 'reactivate', () =>
      this.adminService.reactivateUser(user.id)
    );
  }

  async deleteUser(user: AdminUser): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'admin.users.confirmDeleteTitle',
      bodyKey: 'admin.users.confirmDeleteBody',
      confirmKey: 'common.delete',
      cancelKey: 'common.cancel',
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    this.runAction(user.id, 'delete', () =>
      this.adminService.deleteUser(user.id)
    );
  }

  createUser(): void {
    const payload: CreateUserRequest = {
      email: this.createEmail.trim(),
      password: this.createPassword,
      confirmPassword: this.createConfirm,
      role: this.createRole,
      name: this.createName.trim() || null,
    };

    this.actionLoading.set('create');
    this.error.set(null);
    this.adminService
      .createUser(payload)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.showCreate.set(false);
          this.createEmail = '';
          this.createPassword = '';
          this.createConfirm = '';
          this.createName = '';
          this.loadUsers();
        },
        error: (err) => {
          this.error.set(
            err?.error?.error || this.i18n.instant('admin.users.createFailed')
          );
        },
      });
  }

  roleLabelKey(role: string): string {
    if (role === 'Farm') return 'admin.users.roleFarm';
    if (role === 'Factory') return 'admin.users.roleFactory';
    if (role === 'Admin' || role === 'SuperAdmin') return 'admin.users.roleAdmin';
    return 'admin.users.role';
  }

  private seedReports(users: AdminUser[]): void {
    this.verificationResults.update((prev) => {
      const next = { ...prev };
      for (const user of users) {
        if (next[user.id] || user.lastTrustScore == null) continue;
        next[user.id] = {
          verified: false,
          kybIncomplete: false,
          missingKybKinds: [],
          trustScore: user.lastTrustScore,
          overallSummary: '',
          recommendation: user.lastRecommendation ?? 'NeedsReview',
          comparison: [],
        };
      }
      return next;
    });
  }

  private ensureReport(user: AdminUser): void {
    const existing = this.verificationResults()[user.id];
    if (existing?.comparison?.length) {
      return;
    }
    this.adminService
      .getLastKybReport(user.id)
      .pipe(catchError(() => of(null)))
      .subscribe({
        next: (res) => {
          if (res) this.storeReport(user.id, res);
        },
      });
  }

  private storeReport(userId: string, res: VerifyUserResult): void {
    this.verificationResults.update((prev) => ({ ...prev, [userId]: res }));
  }

  private mapHygiene(h: FarmHygiene | FactoryHygiene): ReviewHygiene {
    if ('farmId' in h) {
      return {
        kind: 'farm',
        entityId: h.farmId,
        name: h.farmName,
        isVerified: h.isVerified,
        kybIncomplete: h.kybIncomplete,
        missingKybKinds: h.missingKybKinds,
        documents: h.documents,
        certifications: h.certifications,
      };
    }
    return {
      kind: 'factory',
      entityId: h.factoryId,
      name: h.factoryName,
      isVerified: h.isVerified,
      kybIncomplete: h.kybIncomplete,
      missingKybKinds: h.missingKybKinds,
      documents: h.documents,
    };
  }

  private runAction(
    id: string,
    key: string,
    call: () => Observable<unknown>,
    successKey?: string
  ): void {
    this.actionLoading.set(`${key}:${id}`);
    this.error.set(null);
    call()
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.decisionNote = '';
          if (successKey) {
            this.toast.success(this.i18n.instant(successKey));
          }
          this.loadUsers();
        },
        error: (err) => {
          const message = this.actionErrorMessage(err, key);
          this.error.set(message);
          this.toast.error(message);
        },
      });
  }

  private actionErrorMessage(err: { error?: unknown }, key: string): string {
    const fallback = this.i18n.instant('admin.users.actionFailed', { action: key });
    const body = err?.error;
    if (typeof body === 'string' && body.trim()) {
      try {
        const parsed = JSON.parse(body) as { message?: string; error?: string };
        return parsed.message || parsed.error || fallback;
      } catch {
        return body;
      }
    }
    if (body && typeof body === 'object') {
      const parsed = body as { message?: string; error?: string; title?: string };
      return parsed.message || parsed.error || parsed.title || fallback;
    }
    return fallback;
  }
}

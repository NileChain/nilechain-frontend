import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { AdminService } from '../../../core/services/admin/admin.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { TranslateService } from '../../../core/services/translate.service';
import {
  AdminUser,
  CreateUserRequest,
} from '../../../core/models/admin/admin-user.model';

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
  private readonly adminService = inject(AdminService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly i18n = inject(TranslateService);

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

  createEmail = '';
  createPassword = '';
  createConfirm = '';
  createRole = 'Farm';
  createName = '';

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService
      .getUsers({
        page: this.page,
        pageSize: this.pageSize,
        search: this.search || null,
        role: this.roleFilter || null,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          this.users.set(result.items);
          this.totalCount.set(result.totalCount);
          this.totalPages.set(result.totalPages || 1);
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

  roleKey(role: string): string {
    return role.toLowerCase();
  }

  verify(user: AdminUser): void {
    this.runAction(user.id, 'verify', () =>
      this.adminService.verifyUser(user.id)
    );
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
            err?.error?.error ||
              this.i18n.instant('admin.users.createFailed')
          );
        },
      });
  }

  private runAction(
    id: string,
    key: string,
    call: () => ReturnType<AdminService['verifyUser']>
  ): void {
    this.actionLoading.set(`${key}:${id}`);
    this.error.set(null);
    call()
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => this.loadUsers(),
        error: (err) => {
          this.error.set(
            err?.error?.error ||
              this.i18n.instant('admin.users.actionFailed', { action: key })
          );
        },
      });
  }
}

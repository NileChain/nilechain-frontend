import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SidebarAdminComponent } from '../../../shared/components/sidebar-admin/sidebar-admin.component';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { AdminService } from '../../../core/services/admin/admin.service';
import { AdminUser, CreateUserRequest } from '../../../core/models/admin/admin-user.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    TranslatePipe,
    SidebarAdminComponent,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiLoaderComponent,
    FormsModule,
  ],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  readonly currentUser = this.authService.currentUser;

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
        error: () => this.error.set('Failed to load users.'),
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
    this.runAction(user.id, 'verify', () => this.adminService.verifyUser(user.id));
  }

  block(user: AdminUser): void {
    this.runAction(user.id, 'block', () => this.adminService.blockUser(user.id));
  }

  unblock(user: AdminUser): void {
    this.runAction(user.id, 'unblock', () => this.adminService.unblockUser(user.id));
  }

  deactivate(user: AdminUser): void {
    this.runAction(user.id, 'deactivate', () => this.adminService.deactivateUser(user.id));
  }

  reactivate(user: AdminUser): void {
    this.runAction(user.id, 'reactivate', () => this.adminService.reactivateUser(user.id));
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
          this.error.set(err?.error?.error || 'Failed to create user.');
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
          this.error.set(err?.error?.error || `Failed to ${key} user.`);
        },
      });
  }
}

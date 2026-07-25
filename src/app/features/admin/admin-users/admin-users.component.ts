import { Component, OnInit, signal, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUser, UpdateUserRequest } from '../../../core/models/admin-user.model';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

type RoleFilter = 'all' | 'farm' | 'factory' | 'admin';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [TranslatePipe, UiLanguageToggleComponent, UiThemeToggleComponent, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly title = inject(Title);

  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly activeFilter = signal<RoleFilter>('all');
  readonly searchTerm = signal('');
  readonly searchInput = signal('');
  private readonly searchSubject = new Subject<string>();

  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly pageSize = signal(10);
  readonly totalPages = signal(0);

  // Add modal
  readonly showAddModal = signal(false);
  readonly addingUser = signal(false);
  readonly addError = signal('');

  addForm = {
    email: '',
    password: '',
    confirmPassword: '',
    role: 'farm' as string,
    name: '',
    governorate: '',
    sizeInFeddans: null as number | null,
  };

  // Edit modal
  readonly showEditModal = signal(false);
  readonly editingUser = signal<AdminUser | null>(null);
  readonly savingEdit = signal(false);
  readonly editError = signal('');

  editForm = {
    name: '',
    role: 'farm' as string,
    isVerified: false,
    governorate: '',
    sizeInFeddans: null as number | null,
  };

  constructor() {
    this.title.setTitle('NileChain - Admin Users');
  }

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.page.set(1);
        this.loadUsers();
      });

    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set('');

    const filter = this.activeFilter();
    const role = filter === 'all' ? undefined : filter;
    const search = this.searchTerm() || undefined;

    this.adminService.getUsers(role, search, this.page(), this.pageSize()).subscribe({
      next: (result) => {
        this.users.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load users.');
        this.loading.set(false);
      },
    });
  }

  onSearchInput(value: string): void {
    this.searchInput.set(value);
    this.searchSubject.next(value);
  }

  setFilter(filter: RoleFilter): void {
    this.activeFilter.set(filter);
    this.page.set(1);
    this.loadUsers();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadUsers();
  }

  onVerify(user: AdminUser): void {
    this.adminService.verifyUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: () => this.error.set(`Failed to verify ${user.displayName || user.email}`),
    });
  }

  onToggleBlock(user: AdminUser): void {
    const action = user.isBlocked
      ? this.adminService.unblockUser(user.id)
      : this.adminService.blockUser(user.id);

    action.subscribe({
      next: () => this.loadUsers(),
      error: () => this.error.set(`Failed to update ${user.displayName || user.email}`),
    });
  }

  // ---- Add Modal ----

  openAddModal(): void {
    this.addForm = {
      email: '',
      password: '',
      confirmPassword: '',
      role: 'farm',
      name: '',
      governorate: '',
      sizeInFeddans: null,
    };
    this.addError.set('');
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  onSubmitAdd(): void {
    this.addError.set('');
    this.addingUser.set(true);

    const { email, password, confirmPassword, role, name, governorate, sizeInFeddans } = this.addForm;

    if (!email || !password || !confirmPassword) {
      this.addError.set('Email, password, and confirm password are required.');
      this.addingUser.set(false);
      return;
    }

    if (password !== confirmPassword) {
      this.addError.set('Passwords do not match.');
      this.addingUser.set(false);
      return;
    }

    if ((role === 'farm' || role === 'factory') && !name) {
      this.addError.set('Name is required for farms and factories.');
      this.addingUser.set(false);
      return;
    }

    this.adminService.createUser({
      email,
      password,
      confirmPassword,
      role,
      name: name || undefined,
      governorate: governorate || undefined,
      sizeInFeddans: sizeInFeddans || undefined,
    }).subscribe({
      next: () => {
        this.addingUser.set(false);
        this.closeAddModal();
        this.loadUsers();
      },
      error: (err) => {
        this.addingUser.set(false);
        this.addError.set(err.error?.error || 'Failed to create user.');
      },
    });
  }

  // ---- Edit Modal ----

  openEditModal(user: AdminUser): void {
    this.editingUser.set(user);
    this.editForm = {
      name: user.farmName || user.factoryName || user.displayName || '',
      role: user.role.toLowerCase(),
      isVerified: user.isVerified,
      governorate: '',
      sizeInFeddans: null,
    };
    this.editError.set('');
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingUser.set(null);
  }

  onSubmitEdit(): void {
    this.editError.set('');
    this.savingEdit.set(true);

    const user = this.editingUser();
    if (!user) {
      this.savingEdit.set(false);
      return;
    }

    const payload: UpdateUserRequest = {
      name: this.editForm.name || undefined,
      role: this.editForm.role !== user.role.toLowerCase() ? this.editForm.role : undefined,
      isVerified: this.editForm.isVerified !== user.isVerified ? this.editForm.isVerified : undefined,
      governorate: this.editForm.governorate || undefined,
      sizeInFeddans: this.editForm.sizeInFeddans || undefined,
    };

    if (!payload.name && !payload.role && payload.isVerified === undefined) {
      this.editError.set('No changes to save.');
      this.savingEdit.set(false);
      return;
    }

    this.adminService.updateUser(user.id, payload).subscribe({
      next: () => {
        this.savingEdit.set(false);
        this.closeEditModal();
        this.loadUsers();
      },
      error: (err) => {
        this.savingEdit.set(false);
        this.editError.set(err.error?.error || 'Failed to update user.');
      },
    });
  }

  highlightText(text: string | undefined | null): string {
    const term = this.searchTerm();
    if (!term || !text) return text || '';
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + term.length);
    const after = text.slice(idx + term.length);
    return `${before}<mark>${match}</mark>${after}`;
  }

  getInitial(name: string | undefined | null, email: string): string {
    return (name || email).charAt(0).toUpperCase();
  }

  get displayName(): string {
    const total = this.totalCount();
    const from = (this.page() - 1) * this.pageSize() + 1;
    const to = Math.min(this.page() * this.pageSize(), total);
    return `Showing ${from}-${to} of ${total} users`;
  }
}

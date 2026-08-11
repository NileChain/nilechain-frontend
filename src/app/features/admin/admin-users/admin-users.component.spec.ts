import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminUsersComponent } from './admin-users.component';
import { AdminService } from '../../../core/services/admin/admin.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { TranslateService } from '../../../core/services/translate.service';
import { AdminUser } from '../../../core/models/admin/admin-user.model';

function mockMatchMedia(): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe('AdminUsersComponent confirms', () => {
  const user: AdminUser = {
    id: 'u1',
    email: 'a@b.c',
    role: 'Farm',
    isActive: true,
    isBlocked: false,
    isVerified: true,
    displayName: 'Ada',
    farmName: null,
    factoryName: null,
    createdAt: '2026-01-01',
  };

  let confirmSpy: { confirm: ReturnType<typeof vi.fn> };
  let blockUser: ReturnType<typeof vi.fn>;
  let deactivateUser: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockMatchMedia();
    confirmSpy = {
      confirm: vi.fn().mockResolvedValue(true),
    };
    blockUser = vi.fn().mockReturnValue(of(void 0));
    deactivateUser = vi.fn().mockReturnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [AdminUsersComponent],
      providers: [
        {
          provide: AdminService,
          useValue: {
            getUsers: () =>
              of({
                items: [user],
                totalCount: 1,
                page: 1,
                pageSize: 10,
                totalPages: 1,
              }),
            blockUser,
            deactivateUser,
            unblockUser: () => of(void 0),
            reactivateUser: () => of(void 0),
            verifyUser: () => of(void 0),
            createUser: () => of(void 0),
          },
        },
        { provide: ConfirmDialogService, useValue: confirmSpy },
        {
          provide: TranslateService,
          useValue: {
            ready: () => true,
            currentLang: () => 'en',
            instant: (key: string) => key,
          },
        },
      ],
    }).compileComponents();
  });

  it('asks confirm before block API', async () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    await cmp.block(user);
    expect(confirmSpy.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        titleKey: 'admin.users.confirmBlockTitle',
        danger: true,
      })
    );
    expect(blockUser).toHaveBeenCalledWith('u1');
  });

  it('skips block API when confirm cancelled', async () => {
    confirmSpy.confirm.mockResolvedValueOnce(false);
    const fixture = TestBed.createComponent(AdminUsersComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    await cmp.block(user);
    expect(blockUser).not.toHaveBeenCalled();
  });

  it('asks confirm before deactivate API', async () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    await cmp.deactivate(user);
    expect(confirmSpy.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        titleKey: 'admin.users.confirmDeactivateTitle',
        danger: true,
      })
    );
    expect(deactivateUser).toHaveBeenCalledWith('u1');
  });
});

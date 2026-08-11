import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminCropRequestsComponent } from './admin-crop-requests.component';
import { CropRequestService } from '../../../core/services/crop-request.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { CropRequest } from '../../../core/models/crop-request.model';

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

describe('AdminCropRequestsComponent confirms', () => {
  const req: CropRequest = {
    cropRequestId: 'cr1',
    requestedByUserId: 'u1',
    name: 'Quinoa',
    category: 'Cereals',
    description: null,
    status: 'Pending',
    adminNotes: null,
    reviewedByUserId: null,
    approvedCropTypeId: null,
    createdAt: '2026-01-01',
    reviewedAt: null,
  };

  let confirmSpy: { confirm: ReturnType<typeof vi.fn> };
  let approveCropRequest: ReturnType<typeof vi.fn>;
  let rejectCropRequest: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockMatchMedia();
    confirmSpy = {
      confirm: vi.fn().mockResolvedValue(true),
    };
    approveCropRequest = vi.fn().mockReturnValue(of(void 0));
    rejectCropRequest = vi.fn().mockReturnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [AdminCropRequestsComponent],
      providers: [
        {
          provide: CropRequestService,
          useValue: {
            listCropRequests: () => of([req]),
            approveCropRequest,
            rejectCropRequest,
          },
        },
        { provide: ConfirmDialogService, useValue: confirmSpy },
        {
          provide: ToastService,
          useValue: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
        },
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

  it('asks confirm before approve API', async () => {
    const fixture = TestBed.createComponent(AdminCropRequestsComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    await cmp.approve(req);
    expect(confirmSpy.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        titleKey: 'admin.cropRequests.confirmApproveTitle',
      })
    );
    expect(approveCropRequest).toHaveBeenCalled();
  });

  it('asks confirm before reject API with danger', async () => {
    const fixture = TestBed.createComponent(AdminCropRequestsComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    await cmp.reject(req);
    expect(confirmSpy.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        titleKey: 'admin.cropRequests.confirmRejectTitle',
        danger: true,
      })
    );
    expect(rejectCropRequest).toHaveBeenCalled();
  });

  it('skips reject API when confirm cancelled', async () => {
    confirmSpy.confirm.mockResolvedValueOnce(false);
    const fixture = TestBed.createComponent(AdminCropRequestsComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    await cmp.reject(req);
    expect(rejectCropRequest).not.toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '../../../core/services/translate.service';
import { UiPreviewBannerComponent } from './preview-banner.component';

describe('UiPreviewBannerComponent', () => {
  const fakeTranslate = {
    ready: () => true,
    currentLang: () => 'en',
    instant: (key: string) => key,
  };

  async function render(
    titleKey?: string,
    bodyKey?: string
  ): Promise<{
    fixture: ComponentFixture<UiPreviewBannerComponent>;
    cmp: UiPreviewBannerComponent;
    el: HTMLElement;
  }> {
    await TestBed.configureTestingModule({
      imports: [UiPreviewBannerComponent],
      providers: [{ provide: TranslateService, useValue: fakeTranslate }],
    }).compileComponents();

    const fixture = TestBed.createComponent(UiPreviewBannerComponent);
    const cmp = fixture.componentInstance;
    if (titleKey !== undefined) {
      cmp.titleKey = titleKey;
    }
    if (bodyKey !== undefined) {
      cmp.bodyKey = bodyKey;
    }
    fixture.detectChanges();
    return { fixture, cmp, el: fixture.nativeElement as HTMLElement };
  }

  it('should create', async () => {
    const { cmp } = await render();
    expect(cmp).toBeTruthy();
  });

  it('renders default title and body keys', async () => {
    const { el } = await render();
    expect(el.querySelector('.font-label-lg')?.textContent).toContain(
      'common.previewTitle'
    );
    expect(el.textContent).toContain('common.previewBody');
  });

  it('shows a construction icon', async () => {
    const { el } = await render();
    expect(el.querySelector('ui-icon')).toBeTruthy();
  });

  it('renders a custom title key when provided', async () => {
    const { el } = await render('factory.dashboard.title');
    expect(el.querySelector('.font-label-lg')?.textContent).toContain(
      'factory.dashboard.title'
    );
  });

  it('omits the body when bodyKey is empty', async () => {
    const { el } = await render('factory.dashboard.title', '');
    expect(el.querySelector('.font-body-sm')).toBeNull();
  });
});

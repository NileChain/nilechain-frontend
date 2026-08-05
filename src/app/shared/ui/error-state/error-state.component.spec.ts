import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '../../../core/services/translate.service';
import { UiErrorStateComponent } from './error-state.component';

describe('UiErrorStateComponent', () => {
  const fakeTranslate = {
    ready: () => true,
    currentLang: () => 'en',
    instant: (key: string) => key,
  };

  async function render(
    opts: {
      message?: string | null;
      showRetry?: boolean;
    } = {}
  ): Promise<{
    fixture: ComponentFixture<UiErrorStateComponent>;
    cmp: UiErrorStateComponent;
    el: HTMLElement;
  }> {
    await TestBed.configureTestingModule({
      imports: [UiErrorStateComponent],
      providers: [{ provide: TranslateService, useValue: fakeTranslate }],
    }).compileComponents();

    const fixture = TestBed.createComponent(UiErrorStateComponent);
    const cmp = fixture.componentInstance;
    if (opts.message !== undefined) {
      cmp.message = opts.message;
    }
    if (opts.showRetry !== undefined) {
      cmp.showRetry = opts.showRetry;
    }
    fixture.detectChanges();
    return { fixture, cmp, el: fixture.nativeElement as HTMLElement };
  }

  it('should create', async () => {
    const { cmp } = await render();
    expect(cmp).toBeTruthy();
  });

  it('renders the generic error title', async () => {
    const { el } = await render();
    expect(el.textContent).toContain('common.errorTitle');
  });

  it('shows a retry button by default and emits on click', async () => {
    const { fixture, cmp, el } = await render();
    const button = el.querySelector('button') as HTMLButtonElement;
    expect(button).toBeTruthy();
    let emitted = false;
    cmp.retry.subscribe(() => (emitted = true));
    button.click();
    fixture.detectChanges();
    expect(emitted).toBe(true);
  });

  it('hides the retry button when showRetry is false', async () => {
    const { el } = await render({ showRetry: false });
    expect(el.querySelector('button')).toBeNull();
  });

  it('renders the provided message when set', async () => {
    const { el } = await render({
      message: 'Custom failure message',
      showRetry: false,
    });
    expect(el.textContent).toContain('Custom failure message');
  });
});

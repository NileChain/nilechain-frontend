import { TestBed } from '@angular/core/testing';
import { MobileNavService } from './mobile-nav.service';

describe('MobileNavService', () => {
  let service: MobileNavService;

  beforeEach(() => {
    service = TestBed.inject(MobileNavService);
  });

  afterEach(() => {
    document.body.classList.remove('overflow-hidden');
  });

  it('starts closed', () => {
    expect(service.open()).toBe(false);
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });

  it('openMenu opens and locks scroll', () => {
    service.openMenu();
    expect(service.open()).toBe(true);
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);
  });

  it('toggleMenu flips state', () => {
    service.toggleMenu();
    expect(service.open()).toBe(true);
    service.toggleMenu();
    expect(service.open()).toBe(false);
  });

  it('closeMenu closes and unlocks scroll', () => {
    service.openMenu();
    service.closeMenu();
    expect(service.open()).toBe(false);
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });
});

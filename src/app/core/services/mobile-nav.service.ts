import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MobileNavService {
  readonly open = signal(false);

  toggleMenu(): void {
    this.setOpen(!this.open());
  }

  openMenu(): void {
    this.setOpen(true);
  }

  closeMenu(): void {
    this.setOpen(false);
  }

  private setOpen(next: boolean): void {
    this.open.set(next);
    document.body.classList.toggle('overflow-hidden', next);
    document.documentElement.classList.toggle('overflow-hidden', next);
  }
}

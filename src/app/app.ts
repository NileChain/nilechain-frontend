import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LocaleService } from './core/services/locale.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  /** Eagerly initialize locale (dir/lang) and theme (dark class). */
  private readonly locale = inject(LocaleService);
  private readonly theme = inject(ThemeService);
}

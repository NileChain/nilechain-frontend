import { Injectable, computed, signal } from '@angular/core';

const RECENT_KEY = 'nilechain.recentItems';
const FAVORITES_KEY = 'nilechain.favorites';
const DASHBOARD_LAYOUT_KEY = 'nilechain.dashboardLayout';

export interface RecentItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  at: number;
}

export interface FavoriteItem {
  id: string;
  label: string;
  route: string;
  icon: string;
}

export type DashboardWidgetId =
  | 'kpis'
  | 'charts'
  | 'activity'
  | 'quickActions'
  | 'matches'
  | 'scoreAnalysis';

@Injectable({ providedIn: 'root' })
export class PersonalizationService {
  private readonly recentSignal = signal<RecentItem[]>(this.readRecent());
  private readonly favoritesSignal = signal<FavoriteItem[]>(
    this.readFavorites()
  );
  private readonly layoutSignal = signal<DashboardWidgetId[]>(
    this.readLayout()
  );

  readonly recentItems = this.recentSignal.asReadonly();
  readonly favorites = this.favoritesSignal.asReadonly();
  readonly dashboardLayout = this.layoutSignal.asReadonly();
  readonly hasFavorites = computed(() => this.favoritesSignal().length > 0);

  trackRecent(item: Omit<RecentItem, 'at'>): void {
    const next = [
      { ...item, at: Date.now() },
      ...this.recentSignal().filter((r) => r.id !== item.id),
    ].slice(0, 8);
    this.recentSignal.set(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }

  toggleFavorite(item: FavoriteItem): void {
    const exists = this.favoritesSignal().some((f) => f.id === item.id);
    const next = exists
      ? this.favoritesSignal().filter((f) => f.id !== item.id)
      : [...this.favoritesSignal(), item].slice(0, 12);
    this.favoritesSignal.set(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  }

  isFavorite(id: string): boolean {
    return this.favoritesSignal().some((f) => f.id === id);
  }

  setDashboardLayout(widgets: DashboardWidgetId[]): void {
    this.layoutSignal.set(widgets);
    localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(widgets));
  }

  moveWidget(id: DashboardWidgetId, direction: -1 | 1): void {
    const list = [...this.layoutSignal()];
    const index = list.indexOf(id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const tmp = list[index]!;
    list[index] = list[target]!;
    list[target] = tmp;
    this.setDashboardLayout(list);
  }

  private readRecent(): RecentItem[] {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as RecentItem[];
    } catch {
      return [];
    }
  }

  private readFavorites(): FavoriteItem[] {
    try {
      return JSON.parse(
        localStorage.getItem(FAVORITES_KEY) || '[]'
      ) as FavoriteItem[];
    } catch {
      return [];
    }
  }

  private readLayout(): DashboardWidgetId[] {
    try {
      const raw = localStorage.getItem(DASHBOARD_LAYOUT_KEY);
      if (!raw) {
        return ['kpis', 'quickActions', 'matches', 'scoreAnalysis', 'activity'];
      }
      return JSON.parse(raw) as DashboardWidgetId[];
    } catch {
      return ['kpis', 'quickActions', 'matches', 'scoreAnalysis', 'activity'];
    }
  }
}

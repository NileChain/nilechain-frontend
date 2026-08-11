/**
 * Shared newest-first list helpers for NileChain list pages.
 * Prefer API timestamps (ISO); never sort by formatted display strings.
 */

export type ListSortMode =
  | 'newest'
  | 'oldest'
  | 'matchScore'
  | 'matchScoreAsc';

export function normalizeListSort(sort: string | null | undefined): ListSortMode {
  const s = (sort || '').trim().toLowerCase();
  if (s === 'oldest' || s === 'created_asc') return 'oldest';
  if (s === 'matchscore' || s === 'score' || s === 'matchscore_desc') {
    return 'matchScore';
  }
  if (s === 'matchscoreasc' || s === 'matchscore_asc' || s === 'score_asc') {
    return 'matchScoreAsc';
  }
  return 'newest';
}

export function compareByCreatedAtDesc(
  a: string | null | undefined,
  b: string | null | undefined,
  idA?: string,
  idB?: string
): number {
  const ta = a ? Date.parse(a) : 0;
  const tb = b ? Date.parse(b) : 0;
  if (tb !== ta) return tb - ta;
  return (idB || '').localeCompare(idA || '');
}

export function compareByCreatedAtAsc(
  a: string | null | undefined,
  b: string | null | undefined,
  idA?: string,
  idB?: string
): number {
  return -compareByCreatedAtDesc(a, b, idA, idB);
}

export function compareByNumberDesc(
  a: number | null | undefined,
  b: number | null | undefined
): number {
  return (b ?? Number.NEGATIVE_INFINITY) - (a ?? Number.NEGATIVE_INFINITY);
}

export function compareByNumberAsc(
  a: number | null | undefined,
  b: number | null | undefined
): number {
  return (a ?? Number.POSITIVE_INFINITY) - (b ?? Number.POSITIVE_INFINITY);
}

/** Relative label key + params for i18n, with absolute date always available separately. */
export function relativeTimeParts(
  iso: string | null | undefined,
  nowMs = Date.now()
): { key: string; params?: Record<string, number> } | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const diffSec = Math.round((nowMs - t) / 1000);
  if (diffSec < 45) return { key: 'common.relative.justNow' };
  if (diffSec < 3600) {
    return {
      key: 'common.relative.minutesAgo',
      params: { count: Math.max(1, Math.round(diffSec / 60)) },
    };
  }
  if (diffSec < 86400) {
    return {
      key: 'common.relative.hoursAgo',
      params: { count: Math.max(1, Math.round(diffSec / 3600)) },
    };
  }
  if (diffSec < 86400 * 7) {
    return {
      key: 'common.relative.daysAgo',
      params: { count: Math.max(1, Math.round(diffSec / 86400)) },
    };
  }
  return null;
}

/** Proposed matches created within this window surface in the "New matches" section. */
export const NEW_MATCH_WINDOW_MS = 72 * 60 * 60 * 1000;

export function isNewMatch(
  status: string | null | undefined,
  createdAt: string | null | undefined,
  nowMs = Date.now()
): boolean {
  const s = (status || '').toLowerCase();
  if (s !== 'proposed') return false;
  if (!createdAt) return false;
  const t = Date.parse(createdAt);
  if (!Number.isFinite(t)) return false;
  return nowMs - t <= NEW_MATCH_WINDOW_MS;
}

/**
 * Egyptian mobile phone helpers (local 01xxxxxxxxx).
 * Mirrors backend NileChain.Application.Validation.Common.EgyptianPhone.
 */

export function normalizeEgyptianPhone(raw: string | null | undefined): string {
  if (!raw?.trim()) {
    return '';
  }

  let s = raw
    .trim()
    .replace(/[\s\-().]/g, '');

  if (s.startsWith('+20')) {
    s = '0' + s.slice(3);
  } else if (s.startsWith('0020')) {
    s = '0' + s.slice(4);
  } else if (s.startsWith('20') && s.length === 12) {
    s = '0' + s.slice(2);
  }

  return s.replace(/\D/g, '');
}

export function isValidEgyptianPhone(raw: string | null | undefined): boolean {
  return /^01\d{9}$/.test(normalizeEgyptianPhone(raw));
}

export const EGYPTIAN_PHONE_ERROR_KEY = 'validation.egyptianPhone';

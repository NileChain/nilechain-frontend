import { ContractDocumentModel } from './models/contract-document.model';

export interface ContractTocItem {
  id: string;
  index: number;
  title: string;
}

export interface ContractBodySection {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface ContractSummaryBullet {
  icon: string;
  labelKey: string;
  value: string;
  tone?: 'neutral' | 'price' | 'risk-low' | 'risk-mid' | 'risk-high';
}

/** Arabic ordinals + digits used in المادة / البند headings. */
const AR_ORDINAL =
  '(?:الأول[ىي]?|الثان[ىي]ة?|الثالث(?:ة)?|الرابع(?:ة)?|الخامس(?:ة)?|السادس(?:ة)?|السابع(?:ة)?|الثامن(?:ة)?|التاسع(?:ة)?|العاشر(?:ة)?|الحادي(?:ة)?\\s*عشر(?:ة)?|الثاني(?:ة)?\\s*عشر(?:ة)?|\\d+)';

const HEADING_RE = new RegExp(
  [
    '^(?:#{1,3}\\s+)',
    '^(?:\\d{1,2}[\\.\\-\\)]\\s+)',
    '^(?:Article\\s+\\d+[:.\\-\\s]+)',
    '^(?:Section\\s+\\d+[:.\\-\\s]+)',
    '^(?:Clause\\s+\\d+[:.\\-\\s]+)',
    `^(?:البند\\s*${AR_ORDINAL}[:.\\-\\s]*)`,
    `^(?:المادة\\s*${AR_ORDINAL}[:.\\-\\s]*)`,
    '^(?:أولا[ًا]?|ثانيا[ًا]?|ثالثا[ًا]?|رابعا[ًا]?|خامسا[ًا]?|سادسا[ًا]?|سابعا[ًا]?|ثامنا[ًا]?|تاسعا[ًا]?|عاشرا[ًا]?)[:.\\-\\s]',
    '^(?:شروط\\s+(?:التسليم|الدفع|الجودة|العقد))',
    '^(?:التزامات\\s+(?:المصنع|المزرعة|الطرف))',
    '^(?:فض\\s+النزاعات|حل\\s+النزاعات|القانون\\s+المطبق)',
    '^(?:مدة\\s+العقد|إنهاء\\s+العقد|Parties|Payment|Delivery|Quality)',
  ].join('|'),
  'i'
);

const SIGNATURE_HEADING_RE =
  /^(?:#{1,3}\s*)?(?:التوقيعات|خانات\s*التوقيع|Signatures?|Signature\s*blocks?)\s*:?\s*$/i;

const SIGNATURE_LINE_RE =
  /^(?:توقيع\s*(?:المورد|المشتري|الطرف|المصنع|المزرعة|الأول|الثاني)|(?:التوقيع|التاريخ)\s*:)/i;

const SIGNATURE_BLANK_RE = /_{3,}|\.{3,}|…|ـ{3,}/;

/**
 * Remove handwritten signature blanks from generated prose.
 * Platform e-signature UI is the source of truth for signing state.
 */
export function stripHandwrittenSignatureBlocks(
  raw: string | null | undefined
): string {
  const text = (raw || '').replace(/\r\n/g, '\n');
  if (!text.trim()) {
    return text;
  }

  const lines = text.split('\n');
  const kept: string[] = [];
  let dropping = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const plain = stripInlineMarkdown(trimmed);

    if (SIGNATURE_HEADING_RE.test(plain) || SIGNATURE_HEADING_RE.test(trimmed)) {
      dropping = true;
      continue;
    }

    if (dropping) {
      if (
        HEADING_RE.test(plain) &&
        !SIGNATURE_HEADING_RE.test(plain) &&
        !SIGNATURE_LINE_RE.test(plain)
      ) {
        dropping = false;
      } else {
        continue;
      }
    }

    if (
      SIGNATURE_LINE_RE.test(plain) ||
      (SIGNATURE_BLANK_RE.test(plain) &&
        /توقيع|التاريخ|signature|date/i.test(plain))
    ) {
      continue;
    }

    kept.push(line);
  }

  return kept
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Strip markdown emphasis markers without inventing content. */
export function stripInlineMarkdown(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^#+\s*/, '')
    .trim();
}

/**
 * Parse the full generated contract text into readable sections.
 * Never fabricates legal clause titles that are not present in the source text.
 */
export function parseContractSections(
  raw: string | null | undefined
): ContractBodySection[] {
  const text = stripHandwrittenSignatureBlocks(raw);
  if (!text) {
    return [];
  }

  const lines = text.split('\n');
  const sections: ContractBodySection[] = [];
  let current: ContractBodySection | null = null;
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (!current) {
      return;
    }
    const joined = buffer.join('\n').trim();
    if (joined) {
      current.paragraphs.push(
        ...joined
          .split(/\n{2,}/)
          .map((p) => stripInlineMarkdown(p.trim()))
          .filter(Boolean)
      );
    }
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      buffer.push('');
      continue;
    }

    const plain = stripInlineMarkdown(trimmed);

    // Document chrome is not a legal clause heading.
    if (
      /^بسم\s+الله/.test(plain) ||
      /^عقد\s+توريد/.test(plain) ||
      /^Agricultural Supply (Agreement|Contract)$/i.test(plain)
    ) {
      continue;
    }

    const isHeading =
      HEADING_RE.test(plain) ||
      HEADING_RE.test(trimmed) ||
      isStandaloneTitle(plain);

    if (isHeading) {
      flushBuffer();
      if (current) {
        sections.push(current);
      }
      current = {
        id: `sec-${sections.length + 1}`,
        title: plain.replace(/^\d{1,2}[\.\-\)]\s*/, ''),
        paragraphs: [],
      };
      continue;
    }

    if (!current) {
      // Keep leading prose under a neutral body label — do not invent legal articles.
      current = {
        id: 'sec-1',
        title: '',
        paragraphs: [],
      };
    }
    buffer.push(plain);
  }

  flushBuffer();
  if (current) {
    sections.push(current);
  }

  // If nothing split cleanly, keep the complete text as a single continuous body.
  if (!sections.length) {
    return [
      {
        id: 'sec-1',
        title: '',
        paragraphs: splitParagraphs(text),
      },
    ];
  }

  return sections;
}

function isStandaloneTitle(plain: string): boolean {
  if (plain.length > 80 || plain.endsWith('.') || plain.includes('EGP')) {
    return false;
  }
  // Document title / bismillah are chrome — handled separately, not clause headings.
  if (/^عقد\s+توريد/.test(plain) || /^بسم\s+الله/.test(plain)) {
    return false;
  }
  if (
    /^[A-Z][A-Za-z0-9 ,/\-]{2,}$/.test(plain) &&
    !plain.includes('ton') &&
    plain.split(' ').length <= 8 &&
    !/^Agricultural Supply (Agreement|Contract)$/i.test(plain)
  ) {
    return true;
  }
  return false;
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\n/)
    .map((p) => stripInlineMarkdown(p.trim()))
    .filter(Boolean);
}

export function buildToc(sections: ContractBodySection[]): ContractTocItem[] {
  const legal = sections
    .filter((s) => s.title.trim().length > 0 || s.paragraphs.length > 0)
    .map((s, i) => ({
      id: s.id,
      index: i + 3,
      title: s.title.trim() || `§ ${i + 1}`,
    }));

  return [
    { id: 'sec-parties', index: 1, title: 'Parties' },
    { id: 'sec-commercial', index: 2, title: 'Commercial terms' },
    ...legal,
    {
      id: 'sec-signatures',
      index: legal.length + 3,
      title: 'Signatures',
    },
  ];
}

/** Localized TOC labels for structured document chrome. */
export function buildDocumentToc(
  sections: ContractBodySection[],
  labels: { parties: string; commercial: string; signatures: string }
): ContractTocItem[] {
  const legal = sections
    .filter((s) => s.title.trim().length > 0 || s.paragraphs.length > 0)
    .map((s, i) => ({
      id: s.id,
      index: i + 3,
      title: s.title.trim() || `§ ${i + 1}`,
    }));

  return [
    { id: 'sec-parties', index: 1, title: labels.parties },
    { id: 'sec-commercial', index: 2, title: labels.commercial },
    ...legal,
    {
      id: 'sec-signatures',
      index: legal.length + 3,
      title: labels.signatures,
    },
  ];
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Highlight key commercial terms inside already-escaped HTML text. */
export function highlightContractHtml(
  plain: string,
  contract: ContractDocumentModel
): string {
  let html = escapeHtml(plain).replace(/\n/g, '<br>');

  const phrases: { label: string; className: string }[] = [];
  if (contract.cropName) {
    phrases.push({ label: contract.cropName, className: 'hl-crop' });
  }
  if (contract.pricePerTon != null) {
    phrases.push({
      label: String(Math.round(Number(contract.pricePerTon))),
      className: 'hl-price',
    });
    phrases.push({
      label: Number(contract.pricePerTon).toLocaleString(),
      className: 'hl-price',
    });
  }
  if (contract.quantityTons != null) {
    phrases.push({
      label: String(contract.quantityTons),
      className: 'hl-qty',
    });
  }

  const patterns: { re: RegExp; className: string }[] = [
    {
      re: /(\d[\d,]*(?:\.\d+)?\s*(?:EGP|ج\.?\s*م|جنيه)(?:\s*\/\s*(?:ton|طن))?)/gi,
      className: 'hl-price',
    },
    {
      re: /(\d[\d,]*(?:\.\d+)?\s*(?:tons?|طن|أطنان))/gi,
      className: 'hl-qty',
    },
    {
      re: /\b(penalty|penalties|liquidated damages|late delivery|غرامة|جزاء|تعويض اتفاقي)\b/gi,
      className: 'hl-penalty',
    },
    {
      re: /\b(payment|paid|settlement|invoice|الدفع|السداد|التسوية|فاتورة)\b/gi,
      className: 'hl-payment',
    },
    {
      re: /\b(delivery|deliver|shipment|التسليم|التوريد|الشحن)\b/gi,
      className: 'hl-delivery',
    },
  ];

  for (const p of patterns) {
    html = html.replace(p.re, `<mark class="hl ${p.className}">$1</mark>`);
  }

  for (const phrase of phrases) {
    if (!phrase.label || phrase.label.length < 2) {
      continue;
    }
    const escaped = escapeHtml(phrase.label);
    const re = new RegExp(escapeRegExp(escaped), 'gi');
    html = html.replace(re, (match) => {
      if (match.includes('<mark')) {
        return match;
      }
      return `<mark class="hl ${phrase.className}">${match}</mark>`;
    });
  }

  return html;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildContractSummary(
  contract: ContractDocumentModel,
  i18n: { instant: (key: string, params?: Record<string, string | number>) => string }
): ContractSummaryBullet[] {
  const bullets: ContractSummaryBullet[] = [
    {
      icon: 'grass',
      labelKey: 'contractDoc.summaryCrop',
      value: displayText(contract.cropName),
      tone: 'neutral',
    },
    {
      icon: 'scale',
      labelKey: 'contractDoc.summaryQty',
      value: `${contract.quantityTons} ${i18n.instant('common.ton')}`,
      tone: 'neutral',
    },
    {
      icon: 'payments',
      labelKey: 'contractDoc.summaryPrice',
      value:
        contract.pricePerTon != null
          ? `${Number(contract.pricePerTon).toLocaleString()} ${i18n.instant('common.egp')}/${i18n.instant('common.ton')}`
          : '—',
      tone: 'price',
    },
  ];

  if (contract.deliveryDate) {
    const d = new Date(contract.deliveryDate);
    bullets.push({
      icon: 'local_shipping',
      labelKey: 'contractDoc.summaryDelivery',
      value: d.toLocaleDateString(),
      tone: 'neutral',
    });
  }

  return bullets;
}

/** Prefer readable location when stored Unicode was corrupted (e.g. "?????? (Giza)"). */
export function displayText(value: string | null | undefined, fallback = '—'): string {
  if (value == null) {
    return fallback;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return fallback;
  }

  const withoutParen = trimmed.replace(/\([^)]*\)/g, '').trim();
  const broken =
    /[\uFFFD]/.test(trimmed) ||
    (withoutParen.length > 0 &&
      (withoutParen.match(/[?]/g)?.length ?? 0) / withoutParen.length >= 0.5);

  if (broken) {
    const latin = trimmed.match(/\(([^)]+)\)/);
    if (latin?.[1]?.trim()) {
      return latin[1].trim();
    }
    const ascii = trimmed.replace(/[?\uFFFD]+/g, ' ').replace(/\s+/g, ' ').trim();
    return ascii || fallback;
  }

  return trimmed;
}

export function detectDocumentDir(
  text: string | null | undefined
): 'rtl' | 'ltr' {
  const sample = text || '';
  const arabic = (sample.match(/[\u0600-\u06FF]/g) || []).length;
  const latin = (sample.match(/[A-Za-z]/g) || []).length;
  return arabic > latin ? 'rtl' : 'ltr';
}

export function isPreSignContractStatus(
  status: string | null | undefined
): boolean {
  const s = (status || '').toLowerCase();
  return (
    s === 'pendingsignature' ||
    s === 'pendingfarmsignature' ||
    s === 'pendingfactorysignature' ||
    s === 'draft' ||
    s === 'pending'
  );
}

export function contractStatusLabelKey(status: string | null | undefined): string {
  const s = (status || '').toLowerCase();
  if (s === 'signed' || s === 'active') return 'contractDoc.statusSigned';
  if (s === 'pendingfarmsignature') return 'contractDoc.statusPendingFarmSignature';
  if (s === 'pendingfactorysignature') return 'contractDoc.statusPendingFactorySignature';
  if (s === 'pendingsignature') return 'contractDoc.statusPendingSignature';
  if (s === 'draft') return 'contractDoc.statusDraft';
  if (s === 'cancelled' || s === 'rejected') return 'contractDoc.statusRejected';
  if (s === 'completed') return 'contractDoc.statusCompleted';
  return 'contractDoc.statusDraft';
}

export function computeTotalValue(
  quantityTons: number | null | undefined,
  pricePerTon: number | null | undefined
): number | null {
  if (quantityTons == null || pricePerTon == null) {
    return null;
  }
  const q = Number(quantityTons);
  const p = Number(pricePerTon);
  if (!Number.isFinite(q) || !Number.isFinite(p)) {
    return null;
  }
  return q * p;
}

/** Extract leading بسم الله line when present in the generated text. */
export function extractBismillah(raw: string | null | undefined): string | null {
  const first = (raw || '')
    .replace(/\r\n/g, '\n')
    .trim()
    .split('\n')
    .map((l) => stripInlineMarkdown(l.trim()))
    .find(Boolean);
  if (first && /^بسم\s+الله/.test(first)) {
    return first;
  }
  return null;
}

/**
 * Best-effort payment terms from generated prose.
 * Returns null when absent — never invents payment schedules.
 */
export function extractPaymentTermsHint(
  raw: string | null | undefined
): string | null {
  const text = stripHandwrittenSignatureBlocks(raw);
  if (!text.trim()) {
    return null;
  }

  for (const line of text.split('\n')) {
    const plain = stripInlineMarkdown(line.trim());
    if (plain.length < 12 || plain.length > 220) {
      continue;
    }
    if (HEADING_RE.test(plain)) {
      continue;
    }
    if (
      /(الدفع|السداد|التسوية|Payment|paid|settlement|invoice|مقدما|مقدماً|عند الاستلام)/i.test(
        plain
      )
    ) {
      return plain;
    }
  }

  return null;
}

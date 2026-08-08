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

const HEADING_RE =
  /^(?:#{1,3}\s+|(?:\d{1,2}[\.\-\)]\s+)|(?:Article\s+\d+[:.\-\s]+)|(?:Section\s+\d+[:.\-\s]+)|(?:Clause\s+\d+[:.\-\s]+)|(?:البند\s*(?:الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|\d+)[:.\-\s]*)|(?:المادة\s*(?:\d+|الأولى|الثانية|الثالثة)[:.\-\s]*))/i;

const FALLBACK_TOC = [
  'Parties',
  'Scope',
  'Payment',
  'Delivery',
  'Responsibilities',
  'Quality Standards',
  'Force Majeure',
  'Termination',
  'Signatures',
];

export function parseContractSections(raw: string | null | undefined): ContractBodySection[] {
  const text = (raw || '').replace(/\r\n/g, '\n').trim();
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
          .map((p) => p.trim())
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

    const isHeading =
      HEADING_RE.test(trimmed) ||
      (trimmed.length <= 72 &&
        /^[A-Z][A-Za-z0-9 ,/\-]{2,}$/.test(trimmed) &&
        !trimmed.endsWith('.') &&
        !trimmed.includes('EGP'));

    if (isHeading) {
      flushBuffer();
      if (current) {
        sections.push(current);
      }
      const title = trimmed.replace(/^#+\s*/, '').replace(/^\d{1,2}[\.\-\)]\s*/, '');
      current = {
        id: `sec-${sections.length + 1}`,
        title,
        paragraphs: [],
      };
      continue;
    }

    if (!current) {
      current = {
        id: 'sec-1',
        title: 'Preamble',
        paragraphs: [],
      };
    }
    buffer.push(trimmed);
  }

  flushBuffer();
  if (current) {
    sections.push(current);
  }

  if (sections.length <= 1 && text.length > 400) {
    // Fabricate readable TOC chunks for dense unstructured text.
    return chunkUnstructured(text);
  }

  return sections;
}

function chunkUnstructured(text: string): ContractBodySection[] {
  const paras = text
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const per = Math.max(2, Math.ceil(paras.length / FALLBACK_TOC.length));
  const sections: ContractBodySection[] = [];
  for (let i = 0; i < FALLBACK_TOC.length; i++) {
    const slice = paras.slice(i * per, (i + 1) * per);
    if (!slice.length) {
      break;
    }
    sections.push({
      id: `sec-${i + 1}`,
      title: FALLBACK_TOC[i],
      paragraphs: slice,
    });
  }
  if (!sections.length) {
    sections.push({
      id: 'sec-1',
      title: 'Contract Terms',
      paragraphs: [text],
    });
  }
  return sections;
}

export function buildToc(sections: ContractBodySection[]): ContractTocItem[] {
  return sections.map((s, i) => ({
    id: s.id,
    index: i + 1,
    title: s.title,
  }));
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
  let html = escapeHtml(plain);

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

  // Generic legal emphasis patterns (EN + AR).
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
    const days = Math.max(
      0,
      Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
    bullets.push({
      icon: 'local_shipping',
      labelKey: 'contractDoc.summaryDelivery',
      value:
        days > 0
          ? i18n.instant('contractDoc.summaryDeliveryWithin', { days })
          : d.toLocaleDateString(),
      tone: 'neutral',
    });
  }

  bullets.push({
    icon: 'account_balance',
    labelKey: 'contractDoc.summaryPayment',
    value: i18n.instant('contractDoc.summaryPaymentAfter'),
    tone: 'neutral',
  });

  const status = (contract.status || '').toLowerCase();
  const risk =
    status === 'signed' || status === 'active'
      ? 'low'
      : status === 'cancelled' || status === 'rejected'
        ? 'high'
        : 'mid';
  bullets.push({
    icon: 'shield',
    labelKey: 'contractDoc.summaryRisk',
    value: i18n.instant(
      risk === 'low'
        ? 'contractDoc.riskLow'
        : risk === 'high'
          ? 'contractDoc.riskHigh'
          : 'contractDoc.riskMedium'
    ),
    tone: risk === 'low' ? 'risk-low' : risk === 'high' ? 'risk-high' : 'risk-mid',
  });

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

export function contractStatusLabelKey(status: string | null | undefined): string {
  const s = (status || '').toLowerCase();
  if (s === 'signed' || s === 'active') return 'contractDoc.statusSigned';
  if (s === 'pendingsignature') return 'contractDoc.statusPendingSignature';
  if (s === 'draft') return 'contractDoc.statusDraft';
  if (s === 'cancelled' || s === 'rejected') return 'contractDoc.statusRejected';
  if (s === 'completed') return 'contractDoc.statusCompleted';
  return 'contractDoc.statusDraft';
}

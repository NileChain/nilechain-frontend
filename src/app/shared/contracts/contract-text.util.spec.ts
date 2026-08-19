/**
 * Focused pure-function checks for contract document helpers.
 * These mirror the backend ContractBodyParser expectations for FE rendering.
 */
import { describe, expect, it } from 'vitest';
import {
  buildDocumentToc,
  extractPaymentTermsHint,
  parseContractSections,
} from './contract-text.util';
import { formatContractNumber } from './contract-document.mapper';
import { diffContractDraft } from './contract-diff.util';

const arabicSample = `
بسم الله الرحمن الرحيم

عقد توريد زراعي

المادة الأولى — موضوع العقد
يتعهد المورد بتوريد القمح.

المادة الثالثة — الثمن وشروط السداد
يتم السداد بنسبة 30٪ مقدماً، و70٪ عند الاستلام والقبول.
`.trim();

describe('contract-text.util', () => {
  it('parses Arabic articles without treating title or bismillah as clauses', () => {
    const sections = parseContractSections(arabicSample);
    expect(sections.length).toBeGreaterThanOrEqual(2);
    expect(
      sections.every((s) => !s.title.includes('عقد توريد') && !s.title.includes('بسم الله'))
    ).toBe(true);
    expect(sections.some((s) => s.title.includes('المادة'))).toBe(true);
  });

  it('extracts payment terms from contract text only', () => {
    const payment = extractPaymentTermsHint(arabicSample);
    expect(payment).toBeTruthy();
    expect(payment).toContain('30٪');
    expect(extractPaymentTermsHint('لا شروط هنا')).toBeNull();
  });

  it('builds a document TOC with parties, commercial, and signatures', () => {
    const sections = parseContractSections(arabicSample);
    const toc = buildDocumentToc(sections, {
      parties: 'Parties',
      commercial: 'Commercial',
      signatures: 'Signatures',
    });
    expect(toc[0].id).toBe('sec-parties');
    expect(toc[1].id).toBe('sec-commercial');
    expect(toc[toc.length - 1].id).toBe('sec-signatures');
  });

  it('formats contract numbers as NC-year-suffix', () => {
    expect(
      formatContractNumber('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '2026-08-14').startsWith(
        'NC-2026-'
      )
    ).toBe(true);
  });

  it('diffs only the changed payment clause', () => {
    const beforeDraft = `المادة الأولى — موضوع العقد
يتعهد المورد بتوريد القمح.

المادة الثالثة — الثمن وشروط السداد
يتم السداد بنسبة 30٪ مقدماً.`;
    const afterDraft = `المادة الأولى — موضوع العقد
يتعهد المورد بتوريد القمح.

المادة الثالثة — الثمن وشروط السداد
يتم السداد بنسبة 40٪ مقدماً.`;
    const diffs = diffContractDraft(beforeDraft, afterDraft);
    expect(diffs.some((d) => d.kind === 'changed' && d.title.includes('الثالثة'))).toBe(true);
    expect(diffs.some((d) => d.title.includes('الأولى'))).toBe(false);

    const priceDiff = diffs.find((d) => d.title.includes('الثالثة'));
    expect(priceDiff).toBeTruthy();
    expect(priceDiff!.afterParagraphs.every((p) => p.includes('40٪'))).toBe(true);
    expect(
      priceDiff!.paragraphs.some((p) =>
        p.ops.some((op) => op.kind === 'delete' && op.text.includes('30٪'))
      )
    ).toBe(true);
    expect(
      priceDiff!.paragraphs.some((p) =>
        p.ops.some((op) => op.kind === 'insert' && op.text.includes('40٪'))
      )
    ).toBe(true);
  });
});

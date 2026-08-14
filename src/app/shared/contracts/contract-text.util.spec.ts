/**
 * Focused pure-function checks for contract document helpers.
 * These mirror the backend ContractBodyParser expectations for FE rendering.
 */
import {
  buildDocumentToc,
  extractPaymentTermsHint,
  parseContractSections,
} from './contract-text.util';
import { formatContractNumber } from './contract-document.mapper';
import { diffContractDraft } from './contract-diff.util';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const arabicSample = `
بسم الله الرحمن الرحيم

عقد توريد زراعي

المادة الأولى — موضوع العقد
يتعهد المورد بتوريد القمح.

المادة الثالثة — الثمن وشروط السداد
يتم السداد بنسبة 30٪ مقدماً، و70٪ عند الاستلام والقبول.
`.trim();

const sections = parseContractSections(arabicSample);
assert(sections.length >= 2, 'expected multiple sections');
assert(
  sections.every((s) => !s.title.includes('عقد توريد') && !s.title.includes('بسم الله')),
  'document title/bismillah must not become clause headings'
);
assert(
  sections.some((s) => s.title.includes('المادة')),
  'expected Arabic article titles'
);

const payment = extractPaymentTermsHint(arabicSample);
assert(!!payment && payment.includes('30٪'), 'payment hint should come from text');
assert(extractPaymentTermsHint('لا شروط هنا') === null, 'must not invent payment terms');

const toc = buildDocumentToc(sections, {
  parties: 'Parties',
  commercial: 'Commercial',
  signatures: 'Signatures',
});
assert(toc[0].id === 'sec-parties', 'toc starts with parties');
assert(toc[1].id === 'sec-commercial', 'toc has commercial');
assert(toc[toc.length - 1].id === 'sec-signatures', 'toc ends with signatures');

assert(
  formatContractNumber('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '2026-08-14').startsWith(
    'NC-2026-'
  ),
  'contract number format'
);

const beforeDraft = `المادة الأولى — موضوع العقد
يتعهد المورد بتوريد القمح.

المادة الثالثة — الثمن وشروط السداد
يتم السداد بنسبة 30٪ مقدماً.`;
const afterDraft = `المادة الأولى — موضوع العقد
يتعهد المورد بتوريد القمح.

المادة الثالثة — الثمن وشروط السداد
يتم السداد بنسبة 40٪ مقدماً.`;
const diffs = diffContractDraft(beforeDraft, afterDraft);
assert(diffs.some((d) => d.kind === 'changed' && d.title.includes('الثالثة')), 'price clause should be marked changed');
assert(
  !diffs.some((d) => d.title.includes('الأولى')),
  'unchanged first article must not appear in the diff'
);
const priceDiff = diffs.find((d) => d.title.includes('الثالثة'));
assert(!!priceDiff, 'price section diff missing');
assert(
  priceDiff!.afterParagraphs.every((p) => p.includes('40٪')),
  'diff panel should only keep the revised payment paragraph'
);
assert(
  priceDiff!.paragraphs.some((p) =>
    p.ops.some((op) => op.kind === 'delete' && op.text.includes('30٪'))
  ),
  'old percentage should be marked deleted'
);
assert(
  priceDiff!.paragraphs.some((p) =>
    p.ops.some((op) => op.kind === 'insert' && op.text.includes('40٪'))
  ),
  'new percentage should be marked inserted'
);

console.log('contract-text.util.spec: OK');

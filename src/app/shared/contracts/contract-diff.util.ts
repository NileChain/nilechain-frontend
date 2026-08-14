import {
  ContractBodySection,
  parseContractSections,
} from './contract-text.util';

export type ContractDiffKind = 'added' | 'removed' | 'changed';
export type DiffOpKind = 'equal' | 'insert' | 'delete';

export interface DiffOp {
  kind: DiffOpKind;
  text: string;
}

export interface ContractParagraphDiff {
  kind: ContractDiffKind;
  afterIndex: number | null;
  before: string | null;
  after: string | null;
  ops: DiffOp[];
}

export interface ContractSectionDiff {
  kind: ContractDiffKind;
  title: string;
  beforeParagraphs: string[];
  afterParagraphs: string[];
  paragraphs: ContractParagraphDiff[];
}

export interface ContractRevisionView {
  contractRevisionId?: string;
  previousText: string;
  newText?: string | null;
  instructions: string;
  revisedByParty: string;
  revisedByUserId?: string;
  createdAt: string;
}

function normTitle(title: string): string {
  return (title || '').replace(/\s+/g, ' ').trim();
}

export function paraHighlightKey(title: string, index: number): string {
  return `${normTitle(title)}::${index}`;
}

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

function mergeOps(ops: DiffOp[]): DiffOp[] {
  const out: DiffOp[] = [];
  for (const op of ops) {
    const last = out[out.length - 1];
    if (last && last.kind === op.kind) {
      last.text += op.text;
    } else {
      out.push({ kind: op.kind, text: op.text });
    }
  }
  return out;
}

/** Word-level LCS so a single number/phrase change is visible without rereading the article. */
export function diffWords(before: string, after: string): DiffOp[] {
  if (before === after) {
    return [{ kind: 'equal', text: after }];
  }
  const a = tokenize(before);
  const b = tokenize(after);
  const n = a.length;
  const m = b.length;
  if (n * m > 640_000) {
    return [
      { kind: 'delete', text: before },
      { kind: 'insert', text: after },
    ];
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0)
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const raw: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      raw.push({ kind: 'equal', text: a[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      raw.push({ kind: 'delete', text: a[i] });
      i += 1;
    } else {
      raw.push({ kind: 'insert', text: b[j] });
      j += 1;
    }
  }
  while (i < n) {
    raw.push({ kind: 'delete', text: a[i] });
    i += 1;
  }
  while (j < m) {
    raw.push({ kind: 'insert', text: b[j] });
    j += 1;
  }
  return mergeOps(raw);
}

/** Keep a short window of unchanged wording around the edit in the summary panel. */
export function collapseUnchanged(ops: DiffOp[], radius = 42): DiffOp[] {
  const last = ops.length - 1;
  return ops.map((op, index) => {
    if (op.kind !== 'equal' || op.text.length <= radius * 2) {
      return op;
    }
    const isFirst = index === 0;
    const isLast = index === last;
    if (isFirst && !isLast) {
      return { kind: 'equal', text: `… ${op.text.slice(-radius).trimStart()}` };
    }
    if (isLast && !isFirst) {
      return { kind: 'equal', text: `${op.text.slice(0, radius).trimEnd()} …` };
    }
    return {
      kind: 'equal',
      text: `${op.text.slice(0, radius).trimEnd()} … ${op.text.slice(-radius).trimStart()}`,
    };
  });
}

function levenshtein(a: string, b: string): number {
  const n = a.length;
  const m = b.length;
  let prev = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const cur = new Array<number>(m + 1);
    cur[0] = i;
    for (let j = 1; j <= m; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[m];
}

function similarity(a: string, b: string): number {
  if (a === b) {
    return 1;
  }
  const aa = a.slice(0, 400);
  const bb = b.slice(0, 400);
  const dist = levenshtein(aa, bb);
  return 1 - dist / Math.max(aa.length, bb.length, 1);
}

export function alignParagraphs(
  before: string[],
  after: string[]
): ContractParagraphDiff[] {
  const prev = before.map((p) => p.trim()).filter(Boolean);
  const next = after.map((p) => p.trim()).filter(Boolean);
  const used = new Set<number>();
  const aligned: ContractParagraphDiff[] = [];

  for (let j = 0; j < next.length; j++) {
    const exact = prev.findIndex((p, i) => !used.has(i) && p === next[j]);
    if (exact >= 0) {
      used.add(exact);
      aligned.push({
        kind: 'changed',
        afterIndex: j,
        before: next[j],
        after: next[j],
        ops: [{ kind: 'equal', text: next[j] }],
      });
      continue;
    }

    let best = -1;
    let bestSim = 0;
    for (let i = 0; i < prev.length; i++) {
      if (used.has(i)) {
        continue;
      }
      const score = similarity(prev[i], next[j]);
      if (score > bestSim) {
        bestSim = score;
        best = i;
      }
    }

    if (best >= 0 && bestSim >= 0.34) {
      used.add(best);
      aligned.push({
        kind: 'changed',
        afterIndex: j,
        before: prev[best],
        after: next[j],
        ops: diffWords(prev[best], next[j]),
      });
    } else {
      aligned.push({
        kind: 'added',
        afterIndex: j,
        before: null,
        after: next[j],
        ops: [{ kind: 'insert', text: next[j] }],
      });
    }
  }

  const removed: ContractParagraphDiff[] = [];
  for (let i = 0; i < prev.length; i++) {
    if (used.has(i)) {
      continue;
    }
    removed.push({
      kind: 'removed',
      afterIndex: null,
      before: prev[i],
      after: null,
      ops: [{ kind: 'delete', text: prev[i] }],
    });
  }

  return [...aligned, ...removed];
}

function isUnchangedParagraph(row: ContractParagraphDiff): boolean {
  return !!row.before && !!row.after && row.before === row.after;
}

function toSectionDiff(
  kind: ContractDiffKind,
  title: string,
  rows: ContractParagraphDiff[]
): ContractSectionDiff {
  const visible = rows.filter((row) => !isUnchangedParagraph(row));
  return {
    kind,
    title,
    beforeParagraphs: visible
      .map((row) => row.before)
      .filter((text): text is string => !!text),
    afterParagraphs: visible
      .map((row) => row.after)
      .filter((text): text is string => !!text),
    paragraphs: visible,
  };
}

/** Section-level draft diff so the other party can see what changed without rereading the deed. */
export function diffContractDraft(
  before: string | null | undefined,
  after: string | null | undefined
): ContractSectionDiff[] {
  const previous = parseContractSections(before);
  const current = parseContractSections(after);
  const used = new Set<string>();
  const diffs: ContractSectionDiff[] = [];

  for (const sec of current) {
    const key = normTitle(sec.title);
    const prev = previous.find(
      (s) => !used.has(s.id) && normTitle(s.title) === key
    );
    if (!prev) {
      diffs.push(
        toSectionDiff('added', sec.title, alignParagraphs([], sec.paragraphs))
      );
      continue;
    }
    used.add(prev.id);
    const rows = alignParagraphs(prev.paragraphs, sec.paragraphs);
    const changed = rows.filter((row) => !isUnchangedParagraph(row));
    if (!changed.length) {
      continue;
    }
    diffs.push(toSectionDiff('changed', sec.title || prev.title, rows));
  }

  for (const sec of previous) {
    if (used.has(sec.id)) {
      continue;
    }
    diffs.push(
      toSectionDiff(
        'removed',
        sec.title,
        alignParagraphs(sec.paragraphs, []).map((row) => ({
          ...row,
          kind: 'removed' as const,
        }))
      )
    );
  }

  return diffs;
}

export function changedSectionTitleKeys(
  diffs: ContractSectionDiff[]
): Set<string> {
  const keys = new Set<string>();
  for (const diff of diffs) {
    if (diff.kind === 'removed') {
      continue;
    }
    keys.add(normTitle(diff.title));
  }
  return keys;
}

export function changedParagraphKeys(
  diffs: ContractSectionDiff[]
): Set<string> {
  const keys = new Set<string>();
  for (const diff of diffs) {
    for (const para of diff.paragraphs) {
      if (para.afterIndex == null || isUnchangedParagraph(para)) {
        continue;
      }
      keys.add(paraHighlightKey(diff.title, para.afterIndex));
    }
  }
  return keys;
}

export function paragraphOpsMap(
  diffs: ContractSectionDiff[]
): Map<string, DiffOp[]> {
  const map = new Map<string, DiffOp[]>();
  for (const diff of diffs) {
    for (const para of diff.paragraphs) {
      if (para.afterIndex == null || isUnchangedParagraph(para)) {
        continue;
      }
      map.set(
        paraHighlightKey(diff.title, para.afterIndex),
        para.ops.filter((op) => op.kind !== 'delete')
      );
    }
  }
  return map;
}

export function sectionTitleKey(
  section: Pick<ContractBodySection, 'title'>
): string {
  return normTitle(section.title);
}

export function opsAreFullInsert(ops: DiffOp[]): boolean {
  return (
    ops.length > 0 &&
    ops.every(
      (op) => op.kind === 'insert' || (op.kind === 'equal' && !op.text.trim())
    )
  );
}

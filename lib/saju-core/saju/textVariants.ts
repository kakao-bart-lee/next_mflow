import { createHash } from 'crypto';
import { getDataLoader } from './dataLoader';

const PARAGRAPH_SPLIT_RE = /\n{2,}/;
const SENTENCE_SPLIT_RE = /(?<=[.!?])\s+/;
const TAG_RE = /<[^>]+>/g;
const LOOKUP_WHITESPACE_RE = /\s+/g;
const HEADING_RE = /^[^\n.!?]{1,40}$/;

const PREFIX_TRIMS = [
  '또한 ',
  '그 외에도 ',
  '궁극적으로 ',
  '특히 ',
  '따라서 ',
  '이러한 성향을 잘 활용하면 ',
  '이 과정에서 ',
] as const;

const SHORTENING_REPLACEMENTS = [
  ['그러나', '하지만'],
  ['할 수 있을 것입니다', '가능성 큼'],
  ['할 수 있습니다', '가능'],
  ['가능성이 큽니다', '가능성 큼'],
  ['중요합니다', '중요'],
  ['필요합니다', '필요'],
  ['됩니다', '됨'],
  ['있을 것입니다', '있음'],
  ['지니고 있습니다', '가지고 있음'],
  ['갖추고 있습니다', '갖추고 있음'],
] as const;

export interface TextVariants {
  readonly fullText: string;
  readonly briefText: string;
  readonly oneLineSummary: string;
}

interface StoredTextVariantRecord {
  readonly full_text?: unknown;
  readonly brief_text?: unknown;
  readonly one_line_summary?: unknown;
}

interface TextVariantsPayload {
  readonly lookup_index?: Record<string, string>;
  readonly records?: Record<string, StoredTextVariantRecord>;
  readonly tables?: Record<string, Record<string, StoredTextVariantRecord>>;
}

let cachedPayload: TextVariantsPayload | null | undefined;

function toTextVariants(record: StoredTextVariantRecord | null | undefined): TextVariants | null {
  if (!record || typeof record !== 'object') {
    return null;
  }

  return {
    fullText: String(record.full_text ?? ''),
    briefText: String(record.brief_text ?? ''),
    oneLineSummary: String(record.one_line_summary ?? ''),
  };
}

function getTextVariantsPayload(): TextVariantsPayload | null {
  if (cachedPayload !== undefined) {
    return cachedPayload;
  }

  const loaded = getDataLoader().loadTable('interpretation_text_variants');
  if (!loaded || typeof loaded !== 'object') {
    cachedPayload = null;
    return cachedPayload;
  }

  const payload = loaded as TextVariantsPayload;
  if (!payload.lookup_index && !payload.records && !payload.tables) {
    cachedPayload = null;
    return cachedPayload;
  }

  cachedPayload = payload;
  return cachedPayload;
}

export function prepareSourceText(rawText: unknown): string {
  if (rawText === null || rawText === undefined) {
    return '';
  }

  let text = String(rawText);
  text = text.replace(/<\s*li\s*>/gi, '\n- ');
  text = text.replace(/<\s*br\s*\/?\s*>/gi, '\n');
  text = text.replace(TAG_RE, '');
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').map((line) => line.trim());
  const normalized = lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ');
  return normalized.trim();
}

export function normalizeLookupKey(rawKey: unknown): string {
  return String(rawKey ?? '').replace(LOOKUP_WHITESPACE_RE, ' ').trim();
}

export function buildVariantsLookupId(tableCode: string, rowKey: unknown): string {
  return createHash('sha1')
    .update(`${tableCode}|${normalizeLookupKey(rowKey)}`)
    .digest('hex')
    .slice(0, 20);
}

export function getPrecomputedTextVariants(params: {
  tableCode?: string | null;
  rowKey?: string | null;
}): TextVariants | null {
  const { tableCode, rowKey } = params;
  if (!tableCode || rowKey === null || rowKey === undefined) {
    return null;
  }

  const payload = getTextVariantsPayload();
  if (!payload) {
    return null;
  }

  const lookupId = buildVariantsLookupId(tableCode, rowKey);
  const recordId = payload.lookup_index?.[lookupId];
  if (recordId) {
    const directRecord = toTextVariants(payload.records?.[recordId]);
    if (directRecord) {
      return directRecord;
    }
  }

  const tableRows = payload.tables?.[tableCode];
  if (!tableRows) {
    return null;
  }

  const candidates = [
    normalizeLookupKey(rowKey),
    String(rowKey).trim(),
    String(rowKey),
  ];

  for (const candidate of candidates) {
    const match = toTextVariants(tableRows[candidate]);
    if (match) {
      return match;
    }
  }

  return null;
}

function splitParagraphs(text: string): string[] {
  return text
    .split(PARAGRAPH_SPLIT_RE)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function splitSentences(paragraph: string): string[] {
  const normalized = paragraph.replace(/\n/g, ' ').trim();
  return normalized.split(SENTENCE_SPLIT_RE).map((item) => item.trim()).filter(Boolean);
}

function shortenSentence(sentence: string): string {
  let text = prepareSourceText(sentence);
  text = text.replace(/^(?:이|그|해당)\s*(?:사주|명식|연애운|운세|구조|특성|사람|관계|성향)(?:의|은|는|이|가)?\s*/u, '');

  for (const prefix of PREFIX_TRIMS) {
    if (text.startsWith(prefix)) {
      text = text.slice(prefix.length).trim();
    }
  }

  for (const [before, after] of SHORTENING_REPLACEMENTS) {
    text = text.replaceAll(before, after);
  }

  text = text
    .replace(/\b매우\s+/gu, '')
    .replace(/\b자연스럽게\s+/gu, '')
    .replace(/\b점차(?:적으로)?\s+/gu, '')
    .replace(/\b다소\s+/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[ .]+$/g, '');

  return text;
}

function toClauseStyle(sentence: string): string {
  return shortenSentence(sentence)
    .replace(' 하지만 ', ', 하지만 ')
    .replace(' 중요.', ' 중요')
    .replace(' 필요.', ' 필요')
    .replace(/[ .]+$/g, '');
}

function ensureTrailingPeriod(sentence: string): string {
  return sentence.endsWith('.') ? sentence : `${sentence}.`;
}

function collectBriefStatements(fullText: string): string[] {
  const statements: string[] = [];
  const seen = new Set<string>();

  for (const paragraph of splitParagraphs(fullText)) {
    if (HEADING_RE.test(paragraph)) {
      continue;
    }

    const firstSentence = splitSentences(paragraph)[0];
    if (!firstSentence) {
      continue;
    }

    const candidate = shortenSentence(firstSentence);
    const normalized = candidate.toLowerCase();
    if (candidate && !seen.has(normalized)) {
      statements.push(candidate);
      seen.add(normalized);
    }

    if (statements.length >= 5) {
      break;
    }
  }

  if (statements.length === 0) {
    const fallback = shortenSentence(fullText);
    if (fallback) {
      statements.push(fallback);
    }
  }

  return statements.slice(0, 5);
}

export function buildTextVariants(rawText: string): TextVariants {
  const fullText = prepareSourceText(rawText);
  if (!fullText) {
    return {
      fullText: '',
      briefText: '',
      oneLineSummary: '',
    };
  }

  const briefStatements = collectBriefStatements(fullText);
  const briefText = briefStatements
    .map((statement) => ensureTrailingPeriod(statement))
    .join(' ')
    .trim();

  let oneLineSummary = briefStatements
    .slice(0, 2)
    .map((statement) => toClauseStyle(statement))
    .filter(Boolean)
    .join(', ')
    .trim();

  if (oneLineSummary.length > 110 && oneLineSummary.includes(',')) {
    oneLineSummary = oneLineSummary.slice(0, oneLineSummary.lastIndexOf(',')).trim();
  }

  if (oneLineSummary.length > 110) {
    oneLineSummary = `${oneLineSummary.slice(0, 107).replace(/[ ,.;]+$/g, '')}...`;
  }

  return {
    fullText,
    briefText: briefText || fullText,
    oneLineSummary: oneLineSummary || briefText || fullText,
  };
}

export function resolveTextVariants(params: {
  rawText: string;
  tableCode?: string | null;
  rowKey?: string | null;
}): TextVariants {
  const precomputed = getPrecomputedTextVariants({
    tableCode: params.tableCode,
    rowKey: params.rowKey,
  });
  const normalizedSource = prepareSourceText(params.rawText);

  if (precomputed && (!normalizedSource || precomputed.fullText === normalizedSource)) {
    return precomputed;
  }

  return buildTextVariants(params.rawText);
}

/** 도감 본문 HTML을 만드는 작은 도구들. 본문은 그대로 DOM에 들어가므로 값은 모두 `esc`를 거친다. */

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;
const ESCAPES: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };

/** 데이터에 섞인 이모지 아이콘을 걷어 낸다. */
export function plain(value: unknown): string {
  return String(value ?? '')
    .replace(EMOJI, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function esc(value: unknown): string {
  return plain(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);
}

export const code = (value: unknown): string => `<code>${esc(value)}</code>`;

export const codeBlock = (value: string): string => `<pre><code>${esc(value)}</code></pre>`;

/** 도감 안의 다른 문서로 가는 링크. 본문 뷰어가 `#/경로`를 문서 이동으로 처리한다. */
export const docLink = (path: string, label: string): string => `<a href="#${path}">${esc(label)}</a>`;

export const list = (items: readonly string[]): string => (items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '');

export interface TableColumn {
  readonly label: string;
  readonly numeric?: boolean;
}

/** `rows`의 칸은 이미 만들어진 HTML이다. */
export function table(columns: readonly TableColumn[], rows: readonly (readonly string[])[], emptyText = '항목이 없습니다.'): string {
  const head = columns.map((c) => `<th${c.numeric ? ' class="num"' : ''}>${esc(c.label)}</th>`).join('');
  const body = rows.length
    ? rows.map((row) => `<tr>${row.map((cell, i) => `<td${columns[i]?.numeric ? ' class="num"' : ''}>${cell}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${columns.length}">${esc(emptyText)}</td></tr>`;
  return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

const FIELD_LABELS: Readonly<Record<string, string>> = {
  name: '이름',
  nameKo: '한글 이름',
  title: '항목',
  label: '구분',
  description: '설명',
  summary: '요약',
  count: '건수',
  countApprox: '건수',
  percentage: '비율(%)',
  app: '앱',
  location: '위치',
  realWorldLocation: '사용 위치',
  pattern: '패턴',
  currentImpl: '현재 구현',
  isStandard: '표준 여부',
  status: '상태',
  recommendation: '권장 조치',
  useCase: '용도',
  bestPractice: '권장 사용',
  type: '타입',
  defaultValue: '기본값',
  required: '필수',
  prop: '속성',
  default: '기본값',
  desc: '설명',
  content: '표시 내용',
  htmlSnippet: '코드',
  codeSnippet: '코드',
  categoryLabel: '분류',
  total: '합계',
  totalCount: '전체 건수',
  unmigratedRawCount: '미전환 건수',
  rawMarkupCount: '원시 마크업 건수',
  migratedCount: '전환 건수',
  migratedStandardCount: '표준 전환 건수',
  standardCount: '표준 건수',
  unifiedRate: '통일률(%)',
  complianceRate: '준수율(%)',
  styleFamiliesCount: '스타일 패밀리 수',
  variantsCount: 'variant 수',
  sizesCount: '크기 수',
  shapesCount: '모양 수',
  tonesCount: '톤 수',
  presetsCount: '프리셋 수',
  layoutsCount: '레이아웃 수',
  elevationsCount: '고도 단계 수',
};

/** 아이콘·색 같은 꾸밈 값과 내부 식별자는 표에 싣지 않는다. */
const HIDDEN_FIELDS = new Set(['id', 'icon', 'iconEmoji', 'colorTone', 'customClass', 'familyId', 'badgeTone', 'categoryIcon', 'category']);
const CODE_FIELDS = new Set(['htmlSnippet', 'codeSnippet', 'bodySnippet', 'snippet', 'importedFrom', 'location', 'realWorldLocation', 'type', 'defaultValue', 'default', 'prop', 'selector', 'currentImpl']);

type Scalar = string | number | boolean;
const isScalar = (value: unknown): value is Scalar => ['string', 'number', 'boolean'].includes(typeof value);
const isScalarList = (value: unknown): value is Scalar[] => Array.isArray(value) && value.every(isScalar);

export const fieldLabel = (key: string): string => FIELD_LABELS[key] ?? key;

function cell(key: string, value: unknown): string {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'boolean') return value ? '예' : '아니오';
  if (isScalarList(value)) return value.map((v) => esc(v)).join('<br>');
  return CODE_FIELDS.has(key) ? code(value) : esc(value);
}

/** 객체 배열을 표로 만든다. 단순 값(과 단순 값 배열) 필드만 칸이 된다. */
export function autoTable(rows: readonly object[]): string {
  const records = rows as readonly Record<string, unknown>[];
  const keys: string[] = [];
  for (const row of records) {
    for (const [key, value] of Object.entries(row)) {
      if (HIDDEN_FIELDS.has(key) || keys.includes(key)) continue;
      if (isScalar(value) || isScalarList(value)) keys.push(key);
    }
  }
  return table(
    keys.map((key) => ({ label: fieldLabel(key), numeric: records.every((r) => r[key] === undefined || typeof r[key] === 'number') })),
    records.map((row) => keys.map((key) => cell(key, row[key]))),
  );
}

/** 객체의 단순 값 필드를 "항목 / 값" 표로 만든다. */
export function keyValueTable(record: object): string {
  const entries = Object.entries(record).filter(([key, value]) => !HIDDEN_FIELDS.has(key) && isScalar(value));
  return table(
    [{ label: '항목' }, { label: '값', numeric: true }],
    entries.map(([key, value]) => [esc(fieldLabel(key)), typeof value === 'number' ? value.toLocaleString() : cell(key, value)]),
  );
}

/** 본문 HTML에서 검색용 텍스트만 뽑는다. */
export const textOf = (html: string): string => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();

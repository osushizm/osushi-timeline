import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const body = process.env.ISSUE_BODY ?? '';

function field(labelPattern) {
  const re = new RegExp(`### ${labelPattern}\\s*\\n\\n([^\\n]*(?:\\n(?!### )[^\\n]*)*)`, 'm');
  const m = body.match(re);
  if (!m) return '';
  const val = m[1].trim();
  return val === '_No response_' ? '' : val;
}

function escape(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ').trim();
}

const kind = field('追加する種類');
const text = escape(field('タイトル'));
const url = escape(field('URL\\(種類が「URL」のときだけ入力\\)'));

if (!text) {
  console.error('タイトルが空です。処理を中止します。');
  process.exit(1);
}

const heading = kind === 'URL' ? '🔖 あとで読むURL' : '📚 積んでる本';

const yamlPath = path.join(REPO_ROOT, 'src/data/now.yaml');
const lines = fs.readFileSync(yamlPath, 'utf-8').split('\n');

const headingLineIdx = lines.findIndex((l) => l.includes(`heading: "${heading}"`));
if (headingLineIdx === -1) {
  console.error(`heading "${heading}" が now.yaml に見つかりません。処理を中止します。`);
  process.exit(1);
}
const headingIndent = lines[headingLineIdx].match(/^(\s*)/)[1].length;

let entriesLineIdx = headingLineIdx + 1;
while (entriesLineIdx < lines.length && !lines[entriesLineIdx].includes('entries:')) {
  entriesLineIdx++;
}
if (entriesLineIdx >= lines.length) {
  console.error('entries: が見つかりません。処理を中止します。');
  process.exit(1);
}

// entries配下の最後の行を探す。末尾の空行(セクション区切り)は
// 挿入位置の手前に残すため、空行をまたいで確定させない。
let insertIdx = entriesLineIdx + 1;
let itemIndent = null;
let cursor = entriesLineIdx + 1;
let pendingBlankStart = null;
while (cursor < lines.length) {
  const line = lines[cursor];
  if (line.trim() === '') {
    if (pendingBlankStart === null) pendingBlankStart = cursor;
    cursor++;
    continue;
  }
  const indent = line.match(/^(\s*)/)[1].length;
  if (indent <= headingIndent) {
    insertIdx = pendingBlankStart !== null ? pendingBlankStart : cursor;
    break;
  }
  if (itemIndent === null && line.trim().startsWith('- ')) itemIndent = indent;
  pendingBlankStart = null;
  cursor++;
  insertIdx = cursor;
}
if (cursor >= lines.length) {
  insertIdx = pendingBlankStart !== null ? pendingBlankStart : lines.length;
}
const indentStr = ' '.repeat(itemIndent ?? headingIndent + 8);

const newLines = url
  ? [`${indentStr}- text: "${text}"`, `${indentStr}  url: "${url}"`]
  : [`${indentStr}- text: "${text}"`];

lines.splice(insertIdx, 0, ...newLines);
fs.writeFileSync(yamlPath, lines.join('\n'));
console.log(`追加しました: [${kind}] ${text}${url ? ` (${url})` : ''}`);

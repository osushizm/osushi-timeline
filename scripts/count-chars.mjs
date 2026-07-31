import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// このスクリプト自身の場所からosushi-timelineのルートを決める
// (CIでは他リポジトリのディレクトリがcwdになる場合があるため、cwdに依存しない)
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');

// 自動生成されるファイルは「執筆量」に含めない
const EXCLUDE_NAMES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'Cargo.lock',
  'poetry.lock',
  'Gemfile.lock',
  'composer.lock',
  'Pipfile.lock',
  'uv.lock',
  'go.sum',
  'writing-stats.json',
]);
const EXCLUDE_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.bmp',
  '.mp3', '.mp4', '.wav', '.mov', '.avi',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.zip', '.tar', '.gz', '.7z', '.rar',
  '.pdf', '.exe', '.dll', '.so', '.dylib', '.bin',
  '.pyc', '.class', '.jar',
]);

function countRepo(dir) {
  const out = execSync('git ls-files', { cwd: dir, encoding: 'utf-8' });
  const files = out
    .split('\n')
    .filter(Boolean)
    .filter((f) => !EXCLUDE_NAMES.has(path.basename(f)))
    .filter((f) => !EXCLUDE_EXT.has(path.extname(f).toLowerCase()));

  let chars = 0;
  for (const f of files) {
    try {
      chars += [...fs.readFileSync(path.join(dir, f), 'utf-8')].length;
    } catch {
      // 読み込めないファイルはスキップ
    }
  }
  return { chars, fileCount: files.length };
}

// 追加のリポジトリパスを引数で渡すと合算する(例: 他リポジトリをcloneしたパス)
const extraDirs = process.argv.slice(2);
const targets = [REPO_ROOT, ...extraDirs];

let totalChars = 0;
let totalFiles = 0;
for (const dir of targets) {
  const { chars, fileCount } = countRepo(dir);
  totalChars += chars;
  totalFiles += fileCount;
}

const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
const statsPath = path.join(REPO_ROOT, 'src/data/writing-stats.json');
const stats = fs.existsSync(statsPath) ? JSON.parse(fs.readFileSync(statsPath, 'utf-8')) : [];

const entry = { date: today, totalChars, fileCount: totalFiles };
const existingIndex = stats.findIndex((s) => s.date === today);
if (existingIndex >= 0) {
  stats[existingIndex] = entry;
} else {
  stats.push(entry);
}

fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2) + '\n');
console.log(`${today}: ${totalChars.toLocaleString('ja-JP')}文字 (${totalFiles}ファイル, ${targets.length}リポジトリ)`);

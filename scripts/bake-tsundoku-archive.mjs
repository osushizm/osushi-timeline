// weekly-snapshotワークフロー用: archive/DATE.yaml にコピーされた
// now.yamlのうち、type: piles / source: issues のセクションを
// 「その時点でopenだったtsundoku Issue」の内容で解決し、
// 通常の静的items(sourceマーカーなし)に焼き込んで上書きする。
// アーカイブは過去のスナップショットなので、以後Issueがcloseされても
// この時点の記録は変わらない。
import fs from 'node:fs';
import yaml from 'js-yaml';

const REPO = 'osushizm/osushi-timeline';
const BOOK_HEADING = '📚 積んでる本';
const URL_HEADING = '🔖 あとで読むURL';

const archivePath = process.argv[2];
if (!archivePath) {
  console.error('使い方: node bake-tsundoku-archive.mjs <archive-yaml-path>');
  process.exit(1);
}

function field(body, labelPattern) {
  const re = new RegExp(`### ${labelPattern}\\s*\\n\\n([^\\n]*(?:\\n(?!### )[^\\n]*)*)`, 'm');
  const m = body.match(re);
  if (!m) return '';
  const val = m[1].trim();
  return val === '_No response_' ? '' : val;
}

function parseIssueBody(body) {
  return {
    kind: field(body, '追加する種類'),
    text: field(body, 'タイトル'),
    url: field(body, 'URL\\(種類が「URL」のときだけ入力\\)'),
  };
}

async function fetchTsundokuPiles() {
  const token = process.env.GITHUB_TOKEN;
  const book = [];
  const urlList = [];
  if (!token) return [{ heading: BOOK_HEADING, entries: book }, { heading: URL_HEADING, entries: urlList }];

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/issues?state=open&labels=tsundoku&per_page=100`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const issues = await res.json();

  for (const issue of issues) {
    const { kind, text, url } = parseIssueBody(issue.body ?? '');
    if (!text) continue;
    const entry = url ? { text, url } : { text };
    if (kind === 'URL') urlList.push(entry);
    else book.push(entry);
  }
  return [{ heading: BOOK_HEADING, entries: book }, { heading: URL_HEADING, entries: urlList }];
}

const doc = yaml.load(fs.readFileSync(archivePath, 'utf-8'));
const pilesSection = (doc.sections ?? []).find((s) => s.type === 'piles' && s.source === 'issues');

if (pilesSection) {
  pilesSection.items = await fetchTsundokuPiles();
  delete pilesSection.source;
  fs.writeFileSync(archivePath, yaml.dump(doc, { lineWidth: -1 }));
  console.log('tsundokuセクションをIssueの内容で焼き込みました');
} else {
  console.log('source: issues のpilesセクションが見つからないため、そのままにします');
}

// 積読リスト(piles)のtype: piles / source: issues 用。
// GitHubの「tsundoku」ラベルが付いたopen Issueを取得し、
// Issueフォームの回答を積読の本/URLエントリに変換する。
// GH_ISSUES_TOKEN が未設定のときは空リストを返す(ビルドは壊さない)。

export interface TsundokuEntry {
  text: string;
  url?: string;
}

export interface TsundokuPile {
  heading: string;
  entries: TsundokuEntry[];
}

const REPO = 'osushizm/osushi-timeline';
const BOOK_HEADING = '📚 積んでる本';
const URL_HEADING = '🔖 あとで読むURL';

function field(body: string, labelPattern: string): string {
  const re = new RegExp(`### ${labelPattern}\\s*\\n\\n([^\\n]*(?:\\n(?!### )[^\\n]*)*)`, 'm');
  const m = body.match(re);
  if (!m) return '';
  const val = m[1].trim();
  return val === '_No response_' ? '' : val;
}

export function parseTsundokuIssueBody(body: string): { kind: string; text: string; url: string } {
  return {
    kind: field(body, '追加する種類'),
    text: field(body, 'タイトル'),
    url: field(body, 'URL\\(種類が「URL」のときだけ入力\\)'),
  };
}

export async function fetchTsundokuPiles(token?: string): Promise<TsundokuPile[]> {
  const book: TsundokuEntry[] = [];
  const urlList: TsundokuEntry[] = [];
  const authToken = token ?? process.env.GH_ISSUES_TOKEN;

  if (!authToken) {
    return [
      { heading: BOOK_HEADING, entries: book },
      { heading: URL_HEADING, entries: urlList },
    ];
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/issues?state=open&labels=tsundoku&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const issues = (await res.json()) as { body: string | null }[];

    for (const issue of issues) {
      const { kind, text, url } = parseTsundokuIssueBody(issue.body ?? '');
      if (!text) continue;
      const entry: TsundokuEntry = url ? { text, url } : { text };
      if (kind === 'URL') urlList.push(entry);
      else book.push(entry);
    }
  } catch (err) {
    console.warn('[tsundoku] Issueの取得に失敗しました:', err);
  }

  return [
    { heading: BOOK_HEADING, entries: book },
    { heading: URL_HEADING, entries: urlList },
  ];
}

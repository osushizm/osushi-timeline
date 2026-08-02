# 🍣 お寿司のタイムライン

お寿司の「今」がパッとわかるNowページ + 日記 + アーカイブ。
Astro製の静的サイトで、Cloudflare Pagesの無料枠だけで動きます。

## 更新の手順(まとめ)

どれも **編集してcommit & pushするだけ**。Cloudflare Pagesが自動で
ビルド・デプロイします(pushで即デプロイ、さらに毎日4:17 JSTにも自動リビルド)。
コード変更が必要なものはありません。詳しいやり方は各項目の▼リンク先を参照。

| やりたいこと | 編集するもの |
|---|---|
| 「今」の内容を更新する([▼](#今を更新する)) | `src/data/now.yaml` |
| 日記を書く([▼](#日記を書く)) | `templates/diary.md` をコピーして `src/content/diary/YYYY-MM-DD.md` へ |
| クリアしたゲーム・本・映画の感想を書く([▼](#クリアした実績感想を書く)) | `templates/completed.md` をコピーして `src/content/completed/` へ |
| 積読(本・あとで読むURL)を追加/削除する([▼](#積読をissueで管理する)) | GitHubでIssueを作る/closeする(YAML編集不要) |
| お品書きの項目をリンクにする([▼](#お品書きdishesの項目をリンクにする)) | `now.yaml` の該当アイテムに `url:` を追加 |
| ランクやリンクの項目を増やす([▼](#ランクやリンクを増やす)) | `now.yaml` の該当セクションの `items:` |
| セクションを丸ごと増やす([▼](#セクションごと増やす)) | `now.yaml` の `sections:` |
| 週次スナップショットを手動で撮る([▼](#アーカイブの仕組み)) | Actionsタブから `weekly-snapshot` を実行 |

## 構成

```
src/
  data/
    now.yaml            ← 「今」のデータ。普段編集するのは基本これだけ
    archive/            ← 週次スナップショット(Actionsが自動で増やす)
  content/
    diary/
      YYYY-MM-DD.md     ← 日記。ファイルを置くだけで一覧・カレンダーに反映
    completed/
      *.md              ← クリアしたゲーム・読んだ本・観た映画の感想
  components/
    Section.astro       ← セクションディスパッチャ(type→部品の振り分け)
    sections/           ← dishes / ranks / keyword / tags / piles / links
    Calendar.astro      ← クライアント描画カレンダー(月替わり自動追従)
  lib/
    data.ts             ← now.yaml / archiveの読み込み
    tsundoku.ts         ← tsundoku IssueをGitHub APIから取得・変換
  pages/
    index.astro         ← トップ(今)
    diary/              ← バックログ一覧と個別記事
    archive/            ← スナップショット一覧と個別表示
    completed/          ← クリアした実績と感想の一覧(タグで絞り込み可)
    diary-dates.json.ts ← 日記のある日付リスト(カレンダーが参照)
templates/
  diary.md              ← 日記を書くときにコピーするひな形
  completed.md          ← 実績を書くときにコピーするひな形
.github/
  ISSUE_TEMPLATE/
    tsundoku.yml        ← 「積読に追加」Issueフォーム
  workflows/
    snapshot.yml        ← 毎週日曜0:00 JSTにnow.yamlをarchive/へコピー(積読はIssueの内容を焼き込む)
    rebuild.yml         ← 毎日4:17 JSTにCloudflare Pagesを再ビルド
    tsundoku.yml        ← tsundoku Issueの開閉・編集でCloudflare Pagesを再ビルド
scripts/
  bake-tsundoku-archive.mjs ← snapshot.yml用。積読Issueの内容を静的itemsに焼き込む
```

## ローカルで動かす

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ に静的ファイルを生成
```

## Cloudflare Pagesへのデプロイ

1. このプロジェクトをGitHubリポジトリとしてpush
2. Cloudflareダッシュボード → Workers & Pages → Create → Pages → リポジトリを接続
3. ビルド設定:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. デプロイ完了後、Settings → Builds & deployments → **Deploy Hooks** でフックURLを作成
5. GitHubリポジトリの Settings → Secrets and variables → Actions に
   `CLOUDFLARE_DEPLOY_HOOK` という名前でそのURLを登録

これで「pushしたら即デプロイ」「毎日早朝に自動リビルド」の両方が動きます。

## 日々の運用

### 「今」を更新する
`src/data/now.yaml` を編集してpush。スマホならGitHubアプリかWebエディタ
(リポジトリで `.` キー / ファイル表示から鉛筆アイコン)で1行書き換えるだけ。

### 日記を書く
`templates/diary.md` をコピーして `src/content/diary/2026-08-01.md` のような
ファイル名で保存し、中身を書き換える:

```markdown
---
title: 今日のタイトル
date: 2026-08-01
---

本文はふつうのMarkdownで。
```

pushすれば個別ページ・バックログ・カレンダーの🍣がすべて自動生成されます。

### クリアした実績・感想を書く
`templates/completed.md` をコピーして `src/content/completed/` に好きな
ファイル名(例: `valorant-s1.md`)で保存する:

```markdown
---
title: 作品タイトル
category: game   # game / book / movie。新しいカテゴリも自由に増やせる
date: 2026-08-01
image: /completed/xxx.jpg   # 省略可。サムネイル画像
---

感想をMarkdownで書く。
```

pushすると `/completed/` ページに一覧・カテゴリ絞り込みタブが自動生成されます。
`game`/`book`/`movie` 以外のカテゴリ文字列を書いた場合もページは壊れず、
アイコンだけ汎用の🏷️になります(コード変更不要)。

サムネイルを付けたい場合は画像ファイルを `public/completed/` に置き、
`image: /completed/ファイル名.jpg` で指定する。本の縦長カバーもゲームの
横長画像も、カード上では同じ横長(16:9)の枠に自動でトリミングされて
サイズが揃う。省略すればこれまで通り画像なしのカードになる。

### 積読をIssueで管理する
積読リスト(📚積んでる本 / 🔖あとで読むURL)は `now.yaml` に直接
書かず、**「tsundoku」ラベルが付いたGitHub Issueがopenの間だけ**
サイトに表示される。読み終えてIssueをcloseすれば一覧から消える。

1. GitHubアプリ、またはリポジトリのIssuesタブから **New issue**
2. テンプレート「📚 積読に追加」を選ぶ
3. 「本」か「URL」を選んでタイトル(URLの場合は本文のURLも)を入力して送信
4. 読み終わったら、そのIssueをCloseするだけ

Issueの開閉・編集をトリガーに `tsundoku-rebuild` ワークフローが
Cloudflare Pagesの再ビルドを叩くので、数十秒〜1分ほどで反映される。

#### 初回セットアップ(1回だけ)
プライベートリポジトリなので、ビルド時にIssue一覧を読むための
read-onlyトークンが必要:

1. https://github.com/settings/personal-access-tokens/new で
   fine-grained PATを発行(Repository access: このリポジトリのみ、
   Permissions: **Issues → Read-only**)
2. Cloudflare Pagesのプロジェクト → Settings → **Environment variables**
   に `GH_ISSUES_TOKEN` という名前でそのトークンを登録(Secret推奨)
3. ローカルでも試したい場合は、リポジトリ直下に `.env` を作って
   `GH_ISSUES_TOKEN=xxxx` と書く(`.env` は `.gitignore` 済み)

トークン未設定でもビルドは失敗せず、積読は単に空欄で表示される。

#### アーカイブとの関係
毎週のスナップショット(`weekly-snapshot`)は、その時点でopenだった
tsundoku Issueの内容を静的なリストとして `archive/日付.yaml` に
焼き込む。アーカイブは過去の記録なので、後からIssueをcloseしても
既に撮った週次スナップショットの内容は変わらない。

### ランクやリンクを増やす
`now.yaml` の該当セクションの `items:` に要素を足すだけ。コード変更は不要。
ランクの `color` は iron / bronze / silver / gold / plat / emerald / diamond / master。

### お品書き(dishes)の項目をリンクにする
`dishes` の各アイテムに `url:` を足すと、カード全体がリンクになりクリックで
新しいタブへ飛ぶようになります(省略すればこれまで通りただのカード)。

```yaml
- label: "📘 いま読んでる参考書"
  value: "Kubernetes完全ガイド 第2版"
  note: "3章・ネットワークまわりを反復中"
  url: "https://example.com/xxx"   # 省略可
```

### セクションごと増やす
既存typeの使い回しなら `sections:` に新しいブロックを書くだけ
(例: `type: dishes` で「今聴いてる音楽」セクションを作る、など)。
専用の見た目が欲しいときは `src/components/sections/` に部品を1つ追加して
`Section.astro` の registry に1行登録。

## アーカイブの仕組み

- 毎週日曜0:00 JSTに `snapshot.yml` が `now.yaml` を `archive/日付.yaml` へコピーしてコミット
- 手動で撮りたいときはActionsタブから `weekly-snapshot` を **Run workflow**
- アーカイブページは「YAMLに存在するセクションだけ」描画するので、
  後から項目を増やしても減らしても過去のスナップショットは壊れません

## カレンダーの自動更新

カレンダーはブラウザ側で現在の月を計算して描画するため、
**サイトを更新しなくても月が変われば自動で今月表示になります。**
前後の月への移動も矢印ボタンでできます。
日記のある日は `diary-dates.json` を参照して🍣が付き、タップでその日の記事へ。

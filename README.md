# 🍣 お寿司のタイムライン

お寿司の「今」がパッとわかるNowページ + 日記 + アーカイブ。
Astro製の静的サイトで、Cloudflare Pagesの無料枠だけで動きます。

## 構成

```
src/
  data/
    now.yaml            ← 「今」のデータ。普段編集するのは基本これだけ
    archive/            ← 週次スナップショット(Actionsが自動で増やす)
  content/
    diary/
      YYYY-MM-DD.md     ← 日記。ファイルを置くだけで一覧・カレンダーに反映
  components/
    Section.astro       ← セクションディスパッチャ(type→部品の振り分け)
    sections/           ← dishes / ranks / keyword / tags / piles / links
    Calendar.astro      ← クライアント描画カレンダー(月替わり自動追従)
  pages/
    index.astro         ← トップ(今)
    diary/              ← バックログ一覧と個別記事
    archive/            ← スナップショット一覧と個別表示
    diary-dates.json.ts ← 日記のある日付リスト(カレンダーが参照)
.github/workflows/
  snapshot.yml          ← 毎週日曜0:00 JSTにnow.yamlをarchive/へコピー&コミット
  rebuild.yml           ← 毎日4:17 JSTにCloudflare Pagesを再ビルド
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
`src/content/diary/2026-08-01.md` のようにファイルを作る:

```markdown
---
title: 今日のタイトル
date: 2026-08-01
---

本文はふつうのMarkdownで。
```

pushすれば個別ページ・バックログ・カレンダーの🍣がすべて自動生成されます。

### ランクやリンクを増やす
`now.yaml` の該当セクションの `items:` に要素を足すだけ。コード変更は不要。
ランクの `color` は iron / bronze / silver / gold / plat / emerald / diamond / master。

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

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
    completed/
      *.md              ← クリアしたゲーム・読んだ本・観た映画の感想
  components/
    Section.astro       ← セクションディスパッチャ(type→部品の振り分け)
    sections/           ← dishes / ranks / keyword / tags / piles / links
    Calendar.astro      ← クライアント描画カレンダー(月替わり自動追従)
  pages/
    index.astro         ← トップ(今)
    diary/              ← バックログ一覧と個別記事
    archive/            ← スナップショット一覧と個別表示
    completed/          ← クリアした実績と感想の一覧(タグで絞り込み可)
    diary-dates.json.ts ← 日記のある日付リスト(カレンダーが参照)
templates/
  diary.md              ← 日記を書くときにコピーするひな形
  completed.md          ← 実績を書くときにコピーするひな形
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
---

感想をMarkdownで書く。
```

pushすると `/completed/` ページに一覧・カテゴリ絞り込みタブが自動生成されます。
`game`/`book`/`movie` 以外のカテゴリ文字列を書いた場合もページは壊れず、
アイコンだけ汎用の🏷️になります(コード変更不要)。

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

# 学習カード（learning-card）

今日の学びを、Instagram Stories向け（1080×1920）の1枚のカードにする静的Webアプリ。
サーバーなし・ログインなし・計測なし。入力と写真は端末内だけで処理します。

- 3デザイン：Editorial（学びが主役）／Journey（軌跡と目標）／Performance（記録が主役）
- 履歴はブラウザの localStorage に保存。DAY番号は累計の記録日数から自動計算（手動調整可）
- 共有：Web Share API（iOS Safari 12.1+ / Android Chrome 128+）→ 非対応時は画像を長押し保存

## 構成
- `index.html` / `styles.css` … UI
- `cards.js` … Canvasでのカード描画（3デザイン）
- `app.js` … 入力、保存、共有

## 公開
GitHub Pages（`main` ブランチ直下）。Cloudflare Pages に移す場合は同じリポジトリを接続し、ビルドコマンドなし・出力ディレクトリ `/` で公開できます。

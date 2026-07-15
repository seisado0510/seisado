【ワンパグゲーム Ver.9.1 修正版】

修正内容
・1人プレイでは必ず1匹だけ表示
・2人協力／2人対戦では2匹表示
・モード切り替え時に2匹目のデータを正しく初期化
・1人プレイ中に2匹目が当たり判定へ参加しないよう修正
・Ver.9の機能はすべて継続

入れ替え方
1. ZIPをすべて展開
2. 中の5ファイルをコピー
3. GitHub → seisado → margherita-game に貼り付け
4. 「ファイルを置き換える」を選択
5. assetsフォルダはそのまま残す

GitHub反映
git add .
git commit -m "1人プレイ重複修正"
git push origin main

確認URL
https://seisado0510.github.io/seisado/margherita-game/?v=19

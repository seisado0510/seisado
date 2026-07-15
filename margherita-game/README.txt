【ワンパグゲーム 完成修正版】

修正内容
・Ver.表記を削除
・ゲーム開始前は、スタートボタンをゲーム画面中央に大きく表示
・ゲーム開始後は、スタートボタンを画面右下の枠外へ小さく移動
・1人プレイでは、マルゲリータ・おかゆ・こんぶから選択可能
・1人プレイでは選んだ1匹だけ表示
・2人協力／2人対戦では2匹表示
・canvasとスタートボタンの重複を整理
・これまでのランキング、実績、BGM、ステージ、天気などは継続

入れ替え方
1. ZIPをすべて展開
2. 中の5ファイルをコピー
3. GitHub → seisado → margherita-game に貼り付け
4. 「ファイルを置き換える」を選択
5. assetsフォルダは消さず、そのまま残す

GitHub反映
git add .
git commit -m "スタートボタン位置修正"
git push origin main

確認URL
https://seisado0510.github.io/seisado/margherita-game/?v=22

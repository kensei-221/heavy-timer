# Heavy Timer

**Molten UX0020 インスパイアード トレーニングタイマー PWA**

ボクシング、HIIT、サウナ利用者向けの重厚なトレーニングタイマーアプリです。

![VT323フォント](https://fonts.google.com/specimen/VT323) のドットマトリクス風表示と、Molten製タイマーの特徴的なブザー音をWeb Audio APIで完全再現しています。

## ✨ 特徴

- 🎯 **オートフローモード**: ワークアウト → 休憩 → 次ラウンドを自動で繰り返し
- 🔊 **Molten UX0020サウンド**: FM合成による独特の電子ブザー音
- 🎨 **LEDグロー効果**: ネオングリーン（ワークアウト）/ 赤（休憩）
- 📱 **PWA対応**: iPhoneのホーム画面に追加してネイティブアプリ風に使用可能
- ⌚ **Apple Watch対応**: コンパクトなレイアウトで視認性を確保

## 🛠 セットアップ

### 必要な環境

- **Node.js** 18以上
- **npm** または **yarn**

### インストール手順

```bash
# 1. プロジェクトディレクトリに移動
cd heavy-timer

# 2. 依存関係のインストール
npm install

# 依存関係の競合が発生した場合は以下を試してください
npm install --legacy-peer-deps

# 3. 開発サーバーの起動
npm run dev
```

開発サーバーが起動したら、ブラウザで `http://localhost:5173` を開いてください。

### 本番ビルド

```bash
npm run build
npm run preview
```

## 📁 ファイル構成

```
heavy-timer/
├── public/                    # 静的ファイル
├── src/
│   ├── App.tsx               # メインアプリケーション
│   ├── main.tsx              # エントリーポイント
│   ├── index.css             # グローバルスタイル
│   ├── components/
│   │   ├── TimerDisplay.tsx  # タイマー表示
│   │   ├── ConfigButtons.tsx # ROUND/TIME/RESTボタン
│   │   ├── ControlButtons.tsx# 再生/リセット/設定ボタン
│   │   └── IOSPicker.tsx     # iOS風ホイールピッカー
│   ├── hooks/
│   │   └── useTimer.ts       # タイマーロジック
│   └── utils/
│       └── soundGenerator.ts # Moltenサウンド合成
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🎮 使い方

1. **設定**: ROUND / TIME / REST ボタンをタップして各値を設定
2. **開始**: 中央の再生ボタンをタップでスタート
3. **自動遷移**: ワークアウト→休憩→次ラウンドが自動的に進行
4. **警告音**: 終了10秒前から拍子木音でカウントダウン
5. **終了**: 最終ラウンド完了時に終了音（3連打）

## 🔊 サウンドについて

すべてのサウンドはWeb Audio APIのFM合成で生成しています（外部ファイル不要）：

- **Molten Buzzer**: ノコギリ波ベース + FM変調で「ブーッ」という濁りのある電子音
- **Wood Block**: 高周波正弦波 + ノイズで「カチッ」という乾いた警告音

## 📱 PWAとしてインストール

### iPhone (Safari)
1. Safariで開く
2. 共有ボタン → 「ホーム画面に追加」

### Android (Chrome)
1. Chromeで開く
2. メニュー → 「ホーム画面に追加」または「アプリをインストール」

## 🛡 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | React 18 |
| ビルドツール | Vite 5 |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| オーディオ | Web Audio API |
| アイコン | Lucide React |
| PWA | vite-plugin-pwa |

## 📄 ライセンス

MIT License

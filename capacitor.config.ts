import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.heavytimer.app',
  appName: 'Heavy Timer',
  webDir: 'dist',
  server: {
    // ローカルWebViewでアプリを実行（サーバー不要）
    androidScheme: 'https',
  },
  ios: {
    // ステータスバーのスタイル
    preferredContentMode: 'mobile',
    scheme: 'Heavy Timer',
    // バックグラウンドオーディオを有効化
    backgroundColor: '#0a0a0a',
  },
  plugins: {
    StatusBar: {
      // ダークテーマに合わせたステータスバー
      style: 'DARK',
      backgroundColor: '#0a0a0a',
    },
    ScreenOrientation: {
      // 縦向き固定
      orientation: 'portrait',
    },
  },
};

export default config;

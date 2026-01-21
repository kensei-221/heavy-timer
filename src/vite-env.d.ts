/// <reference types="vite/client" />

/**
 * Vite環境変数の型定義
 * 
 * .envファイルで定義した環境変数をTypeScriptで使用するための型宣言です。
 * 例: VITE_API_URL などの変数を追加する場合はここに型を追加します。
 */
interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string;
    // 必要に応じて他の環境変数を追加
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

/**
 * Safari用のwebkitAudioContext対応
 */
interface Window {
    webkitAudioContext: typeof AudioContext;
}

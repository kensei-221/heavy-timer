/**
 * Capacitor ネイティブ機能ユーティリティ
 *
 * iOS/Androidネイティブアプリとして動作する際に必要な
 * プラットフォーム固有の機能を提供します。
 */

import { Capacitor } from '@capacitor/core';

/**
 * ネイティブプラットフォーム上で動作しているかチェック
 */
export const isNativePlatform = (): boolean => {
    return Capacitor.isNativePlatform();
};

/**
 * iOSプラットフォームかチェック
 */
export const isIOS = (): boolean => {
    return Capacitor.getPlatform() === 'ios';
};

/**
 * 画面スリープを防止（タイマー動作中に使用）
 * Web APIの WakeLock を使用し、ネイティブでもWebでも動作
 */
let wakeLock: WakeLockSentinel | null = null;

export const keepScreenAwake = async (): Promise<void> => {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        // WakeLock APIが使えない環境ではサイレントに失敗
        console.log('WakeLock not available:', err);
    }
};

export const allowScreenSleep = async (): Promise<void> => {
    try {
        if (wakeLock) {
            await wakeLock.release();
            wakeLock = null;
        }
    } catch (err) {
        console.log('WakeLock release error:', err);
    }
};

/**
 * ステータスバーの初期設定（iOS向け）
 */
export const initStatusBar = async (): Promise<void> => {
    if (!isNativePlatform()) return;

    try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
    } catch (err) {
        console.log('StatusBar not available:', err);
    }
};

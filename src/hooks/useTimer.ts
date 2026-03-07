/**
 * Heavy Timer - タイマーロジック用カスタムフック
 * 
 * このフックはタイマーの全ステートマシンを管理します。
 * 
 * 【ステートマシンの流れ】
 * 1. idle（待機）
 *    ↓ START
 * 2. workout（ワークアウト中）
 *    ↓ 時間終了
 * 3. rest（休憩中）
 *    ↓ 時間終了
 * 4. workout（次のラウンド）...繰り返し
 *    ↓ 最終ラウンド終了
 * 5. finished（完了）
 * 
 * 【React Hooks の解説】
 * - useState: コンポーネントの「状態」を管理
 * - useEffect: 副作用（タイマーなど外部との連携）を管理
 * - useCallback: 関数をメモ化（不要な再生成を防ぐ）
 * - useRef: レンダリングをまたいで値を保持
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    playStartNotification,
    playEndNotification,
    playWarningNotification,
    resumeAudioContext,
    suspendAudioContext
} from '../utils/soundGenerator';
import { keepScreenAwake, allowScreenSleep } from '../utils/capacitor';

// タイマーの状態を表す型
export type TimerState = 'idle' | 'workout' | 'rest' | 'finished';

// タイマー設定の型定義
export interface TimerConfig {
    totalRounds: number;     // 合計ラウンド数
    workoutDuration: number; // ワークアウト時間（秒）
    restDuration: number;    // 休憩時間（秒）
    warningTime: number;     // 警告開始時間（残り秒数）
    volume: number;          // 音量（0.0 〜 1.0）
}

// フックの戻り値の型定義
export interface UseTimerReturn {
    // 現在の状態
    state: TimerState;
    currentRound: number;
    remainingTime: number;
    isWarning: boolean;
    isRunning: boolean; // 動作中かどうか(New)

    // 設定値
    config: TimerConfig;

    // 制御関数
    start: () => void;
    pause: () => void;
    reset: () => void;
    toggle: () => void;

    // 設定変更関数
    setTotalRounds: (rounds: number) => void;
    setWorkoutDuration: (seconds: number) => void;
    setRestDuration: (seconds: number) => void;
    setVolume: (volume: number) => void;
}

// デフォルト設定
const DEFAULT_CONFIG: TimerConfig = {
    totalRounds: 3,
    workoutDuration: 180, // 3分
    restDuration: 60,     // 1分
    warningTime: 10,      // 残り10秒で警告
    volume: 0.5,
};

/**
 * タイマーカスタムフック
 * 
 * @param initialConfig - 初期設定（オプション）
 * @returns タイマーの状態と制御関数
 */
export const useTimer = (initialConfig?: Partial<TimerConfig>): UseTimerReturn => {
    // === 状態管理 ===

    // タイマーの現在の状態（idle/workout/rest/finished）
    const [state, setState] = useState<TimerState>('idle');

    // 現在のラウンド番号（1から開始）
    const [currentRound, setCurrentRound] = useState(1);

    // 残り時間（秒）
    const [remainingTime, setRemainingTime] = useState(0);

    // 進行中フラグ（一時停止管理用）
    const [isRunning, setIsRunning] = useState(false);

    // タイマー設定
    const [config, setConfig] = useState<TimerConfig>({
        ...DEFAULT_CONFIG,
        ...initialConfig,
    });

    // === Refs（レンダリングをまたいで保持する値）===

    // setIntervalのIDを保持（クリーンアップ用）
    const intervalRef = useRef<number | null>(null);

    // 前回の警告音を鳴らした秒数を記録（重複防止）
    const lastWarningTimeRef = useRef<number>(-1);

    // === 派生状態 ===

    // 警告状態かどうか（残り時間が警告時間以下）
    const isWarning = remainingTime > 0 && remainingTime <= config.warningTime;

    // === タイマー制御関数 ===

    /**
     * タイマーをクリアするヘルパー関数
     */
    const clearTimer = useCallback(() => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    /**
     * タイマー開始
     */
    const start = useCallback(async () => {
        // iOSでAudioContextをアクティブにする
        await resumeAudioContext();
        // タイマー動作中は画面スリープを防止
        await keepScreenAwake();
        setIsRunning(true);

        if (state === 'idle' || state === 'finished') {
            // 初めての開始：ワークアウトから開始
            playStartNotification(config.volume); // 開始音: ゴング
            setState('workout');
            setRemainingTime(config.workoutDuration);
            setCurrentRound(1);
            lastWarningTimeRef.current = -1;
        }
        // 既に workout/rest で一時停止中だった場合は、isRunning=true になることで再開される
    }, [state, config.workoutDuration, config.volume]);

    /**
     * タイマー一時停止
     */
    const pause = useCallback(async () => {
        setIsRunning(false);
        clearTimer();
        await suspendAudioContext(); // 音を即時停止
        await allowScreenSleep(); // 画面スリープ再許可
    }, [clearTimer]);

    /**
     * タイマーリセット
     */
    const reset = useCallback(async () => {
        await suspendAudioContext();
        await allowScreenSleep(); // 画面スリープ再許可
        setIsRunning(false);
        clearTimer();
        setState('idle');
        setCurrentRound(1);
        setRemainingTime(config.workoutDuration);
        lastWarningTimeRef.current = -1;
    }, [clearTimer, config.workoutDuration]);

    /**
     * 開始/一時停止の切り替え
     */
    const toggle = useCallback(async () => {
        if (!isRunning) {
            await start();
        } else {
            await pause();
        }
    }, [isRunning, start, pause]);

    // === 設定変更関数 ===

    const setTotalRounds = useCallback((rounds: number) => {
        setConfig(prev => ({ ...prev, totalRounds: rounds }));
    }, []);

    const setWorkoutDuration = useCallback((seconds: number) => {
        setConfig(prev => ({ ...prev, workoutDuration: seconds }));
        if (state === 'idle') {
            setRemainingTime(seconds);
        }
    }, [state]);

    const setRestDuration = useCallback((seconds: number) => {
        setConfig(prev => ({ ...prev, restDuration: seconds }));
    }, []);

    const setVolume = useCallback((volume: number) => {
        setConfig(prev => ({ ...prev, volume }));
    }, []);

    // === タイマーのメインループ（useEffect）===

    useEffect(() => {
        // 停止中 または 完了状態 ではタイマーを停止
        if (!isRunning || state === 'idle' || state === 'finished') {
            clearTimer();
            return;
        }

        // 1秒ごとにカウントダウン
        intervalRef.current = window.setInterval(() => {
            setRemainingTime(prev => {
                const newTime = prev - 1;

                // === 警告音のチェック ===
                if (newTime === config.warningTime && newTime > 0) {
                    playWarningNotification(config.volume);
                }

                // === 時間終了時の処理 ===
                if (newTime <= 0) {
                    if (state === 'workout') {
                        // ワークアウト終了 → 休憩へ
                        playEndNotification(config.volume); // 終了音: Piri Piri

                        if (currentRound < config.totalRounds) {
                            // まだラウンドが残っている場合
                            setState('rest');
                            lastWarningTimeRef.current = -1;
                            return config.restDuration;
                        } else {
                            // 最終ラウンド終了
                            playEndNotification(config.volume); // 終了音(念押し)
                            setState('finished');
                            setIsRunning(false);
                            clearTimer();
                            allowScreenSleep(); // 画面スリープ再許可
                            return 0;
                        }
                    } else if (state === 'rest') {
                        // 休憩終了 → 次のラウンドのワークアウトへ
                        playStartNotification(config.volume); // 開始音: ゴング
                        setCurrentRound(prev => prev + 1);
                        setState('workout');
                        lastWarningTimeRef.current = -1;
                        return config.workoutDuration;
                    }
                }

                return newTime;
            });
        }, 1000);

        // クリーンアップ
        return () => clearTimer();
    }, [state, currentRound, config, clearTimer, isRunning]);

    // === idle状態での初期表示用 (設定変更時などの反映) ===
    useEffect(() => {
        if (state === 'idle' && remainingTime === 0) {
            setRemainingTime(config.workoutDuration);
        }
    }, [state, remainingTime, config.workoutDuration]);

    // === フックの戻り値 ===
    return {
        state,
        currentRound,
        remainingTime,
        isWarning,
        isRunning, // 追加
        config,
        start,
        pause,
        reset,
        toggle,
        setTotalRounds,
        setWorkoutDuration,
        setRestDuration,
        setVolume,
    };
};

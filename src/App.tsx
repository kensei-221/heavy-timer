/**
 * Heavy Timer - メインアプリケーション
 * 
 * すべてのコンポーネントを統合し、アプリ全体の状態を管理します。
 * 
 * 【レイアウト構成】
 * ┌────────────────────────┐
 * │      ROUND 1/3         │  ← ラウンド表示
 * │                        │
 * │        03:00           │  ← メインタイマー
 * │                        │
 * │  [ROUND] [TIME] [REST] │  ← 設定ボタン
 * │                        │
 * │         (▶)            │  ← 再生/停止ボタン
 * │                        │
 * │    (↻)         (⚙)     │  ← リセット / 設定
 * │                        │
 * │      [ 音量調整 ]      │  ← (New) 設定展開時のみ
 * └────────────────────────┘
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TimerDisplay } from './components/TimerDisplay';
import { ConfigButtons } from './components/ConfigButtons';
import { ControlButtons } from './components/ControlButtons';
import { IOSPicker, PickerType } from './components/IOSPicker';
import { useTimer } from './hooks/useTimer';
import { playClickSound, playMenuOpenSound, unlockAudio, loadStartSound } from './utils/soundGenerator';
import { Volume2, VolumeX } from 'lucide-react';

const App: React.FC = () => {
    // === タイマーフックの使用 ===
    const {
        state,
        currentRound,
        remainingTime,
        isWarning,
        isRunning, // 追加: 動作中フラグ
        config,
        toggle: timerToggle,
        reset: timerReset,
        setTotalRounds,
        setWorkoutDuration,
        setRestDuration,
        setVolume
    } = useTimer();

    // === ピッカーモーダルの状態管理 ===
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerType, setPickerType] = useState<PickerType>('rounds');

    // === 設定パネルの状態管理 ===
    const [showSettings, setShowSettings] = useState(false);

    // タイマー動作中判定
    const isTimerActive = state === 'workout' || state === 'rest';

    // 一時停止中かどうか（UI表示用）
    // stateがworkout/restなのにisRunningがfalseなら一時停止
    const isPaused = !isRunning && isTimerActive;

    // === ピッカーを開く関数 ===
    const openPicker = useCallback((type: PickerType) => {
        if (isTimerActive) return;

        unlockAudio();
        playMenuOpenSound(config.volume);
        setPickerType(type);
        setPickerOpen(true);
    }, [isTimerActive, config.volume]);

    // === ピッカーの決定処理 ===
    const handlePickerConfirm = useCallback((value: number) => {
        playClickSound(config.volume);

        switch (pickerType) {
            case 'rounds':
                setTotalRounds(value);
                break;
            case 'workout':
                setWorkoutDuration(value);
                break;
            case 'rest':
                setRestDuration(value);
                break;
        }

        setPickerOpen(false);
    }, [pickerType, setTotalRounds, setWorkoutDuration, setRestDuration, config.volume]);

    // === ピッカーのキャンセル処理 ===
    const handlePickerCancel = useCallback(() => {
        setPickerOpen(false);
    }, []);

    // === 設定ボタン（歯車）の処理 ===
    const handleSettings = useCallback(() => {
        unlockAudio();
        playClickSound(config.volume);
        setShowSettings(prev => !prev);
    }, [config.volume]);

    // === リセット処理（ラッパー） ===
    const handleReset = useCallback(() => {
        unlockAudio();
        playClickSound(config.volume);
        timerReset();
    }, [timerReset, config.volume]);

    // === トグル処理（ラッパー） ===
    const handleToggle = useCallback(() => {
        // ユーザー操作内で同期的にAudioContextをアンロック
        // （開始音は useTimer の start 内で鳴らす）
        unlockAudio();
        timerToggle();
    }, [timerToggle]);

    // === 音量変更 ===
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        // 音量フィードバックは頻繁すぎるとうるさいので、mouseup時などに鳴らすのが一般的だが
        // ここではスライダー操作中は鳴らさず、実際の反映確認として少し遅延させるか、
        // あるいは鳴らさない。IOSPicker側で音が鳴るようになっていれば十分かも。
    };

    // 設定を開いた時にテスト音を鳴らす
    useEffect(() => {
        if (showSettings) {
            // playClickSound(config.volume);
        }
    }, [showSettings]);


    // === 開始音MP3の先読み（初回タップで遅延なく鳴らすため）===
    useEffect(() => {
        loadStartSound().catch(() => {
            /* 読み込み失敗時は再生時に再試行 */
        });
    }, []);

    // === iOS AudioContext のアンロック ===
    useEffect(() => {
        const handleFirstTouch = () => {
            unlockAudio();
            document.removeEventListener('touchstart', handleFirstTouch);
            document.removeEventListener('click', handleFirstTouch);
        };

        document.addEventListener('touchstart', handleFirstTouch);
        document.addEventListener('click', handleFirstTouch);

        return () => {
            document.removeEventListener('touchstart', handleFirstTouch);
            document.removeEventListener('click', handleFirstTouch);
        };
    }, []);

    // === ピッカーに渡す現在値を取得 ===
    const getPickerCurrentValue = (): number => {
        switch (pickerType) {
            case 'rounds':
                return config.totalRounds;
            case 'workout':
                return config.workoutDuration;
            case 'rest':
                return config.restDuration;
        }
    };

    return (
        <div className="min-h-screen bg-timer-bg flex flex-col transition-colors duration-500">
            {/* === ヘッダー（アプリ名）=== */}
            <header className="text-center pt-4 pb-2">
                <h1 className="text-gray-600 text-lg tracking-widest font-vt323">
                    HEAVY TIMER
                </h1>
            </header>

            {/* === メインコンテンツ === */}
            <main className="flex-1 flex flex-col justify-between px-4 pb-safe">
                {/* タイマー表示セクション */}
                <section className="mt-4">
                    <TimerDisplay
                        currentRound={currentRound}
                        totalRounds={config.totalRounds}
                        remainingTime={remainingTime}
                        state={state}
                        isWarning={isWarning}
                    />
                </section>

                {/* 設定ボタン行 */}
                <section className="my-6">
                    <ConfigButtons
                        totalRounds={config.totalRounds}
                        workoutDuration={config.workoutDuration}
                        restDuration={config.restDuration}
                        onRoundPress={() => openPicker('rounds')}
                        onTimePress={() => openPicker('workout')}
                        onRestPress={() => openPicker('rest')}
                        disabled={isTimerActive}
                    />
                </section>

                {/* コントロールボタン */}
                <section className="mb-4">
                    <ControlButtons
                        state={state}
                        isPaused={isPaused}
                        onToggle={handleToggle}
                        onReset={handleReset}
                        onSettings={handleSettings}
                    />

                    {/* 音量調整パネル（設定ボタンでトグル） */}
                    <div className={`
                        overflow-hidden transition-all duration-300 ease-in-out
                        ${showSettings ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}
                    `}>
                        <div className="bg-gray-900/50 rounded-lg p-4 mx-4 border border-gray-800">
                            <div className="flex items-center gap-3">
                                {config.volume === 0 ? <VolumeX size={20} className="text-gray-400" /> : <Volume2 size={20} className="text-green-500" />}
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={config.volume}
                                    onChange={handleVolumeChange}
                                    className="w-full accent-green-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-gray-300 font-mono w-8 text-right">
                                    {Math.round(config.volume * 10)}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* === フッター === */}
            <footer className="text-center py-4 text-gray-700 text-sm font-vt323">
                <p>PWA Training Timer</p>
            </footer>

            {/* === ピッカーモーダル === */}
            <IOSPicker
                isOpen={pickerOpen}
                type={pickerType}
                currentValue={getPickerCurrentValue()}
                onConfirm={handlePickerConfirm}
                onCancel={handlePickerCancel}
            />
        </div>
    );
};

export default App;

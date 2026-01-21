/**
 * Heavy Timer - タイマー表示コンポーネント
 * 
 * 画面上部に表示される以下の要素を担当：
 * 1. ラウンド表示（ROUND 1/3）
 * 2. メインタイマー表示（03:00）
 * 
 * 【デザインのポイント】
 * - VT323フォント：レトロなドットマトリクス風
 * - LEDグロー効果：text-shadowで発光感を表現
 * - ワークアウト時は緑、休憩時は赤
 */

import React from 'react';
import { TimerState } from '../hooks/useTimer';

interface TimerDisplayProps {
    currentRound: number;    // 現在のラウンド番号
    totalRounds: number;     // 合計ラウンド数
    remainingTime: number;   // 残り時間（秒）
    state: TimerState;       // タイマーの状態
    isWarning: boolean;      // 警告状態かどうか
}

/**
 * 秒数を「MM:SS」形式にフォーマット
 * 
 * @param seconds - 秒数
 * @returns フォーマットされた文字列（例: "03:00"）
 */
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    // padStart: 指定した文字数になるまで先頭を'0'で埋める
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 状態に応じたラベルを返す
 */
const getStateLabel = (state: TimerState): string => {
    switch (state) {
        case 'workout':
            return 'WORKOUT';
        case 'rest':
            return 'REST';
        case 'finished':
            return 'FINISHED';
        default:
            return 'READY';
    }
};

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
    currentRound,
    totalRounds,
    remainingTime,
    state,
    isWarning,
}) => {
    // 休憩中かどうかで色を切り替える
    const isRest = state === 'rest';

    // 警告状態での追加クラス（フラッシュ効果）
    const warningClass = isWarning ? 'warning-flash' : '';

    return (
        <div className="flex flex-col items-center pt-8 pb-4">
            {/* === ラウンド表示 === */}
            <div className="text-gray-400 text-2xl tracking-wider mb-2">
                ROUND {currentRound}/{totalRounds}
            </div>

            {/* === 状態ラベル === */}
            <div className={`text-lg tracking-widest mb-4 ${isRest ? 'text-red-400' : state === 'finished' ? 'text-yellow-400' : 'text-green-400'
                }`}>
                {getStateLabel(state)}
            </div>

            {/* === メインタイマー表示 === */}
            {/* 
        クラスの解説：
        - font-vt323: VT323フォント適用
        - text-8xl / sm:text-9xl: レスポンシブなフォントサイズ
        - glow-green / glow-red: LEDグロー効果（index.cssで定義）
        - tabular-nums: 数字の幅を固定（カウントダウン時のガタつき防止）
      */}
            <div
                className={`
          font-chakra
          text-7xl sm:text-9xl 
          tracking-wider
          ${isRest ? 'glow-red' : 'glow-green'}
          ${warningClass}
          tabular-nums
          transition-colors duration-300
        `}
                // aria-labelでスクリーンリーダー対応
                aria-label={`残り時間 ${formatTime(remainingTime)}`}
                role="timer"
            >
                {formatTime(remainingTime)}
            </div>
        </div>
    );
};

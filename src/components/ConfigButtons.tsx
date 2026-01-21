/**
 * Heavy Timer - 設定ボタン行コンポーネント
 * 
 * タイマー表示の下に配置される3つの設定ボタン：
 * - ROUND: 総ラウンド数の設定
 * - TIME: ワークアウト時間の設定
 * - REST: 休憩時間の設定
 * 
 * 各ボタンをタップすると、iOSスタイルのピッカーモーダルが開きます。
 */

import React from 'react';

interface ConfigButtonsProps {
    totalRounds: number;
    workoutDuration: number;
    restDuration: number;
    onRoundPress: () => void;
    onTimePress: () => void;
    onRestPress: () => void;
    disabled?: boolean;  // タイマー動作中は無効化
}

/**
 * 秒数を「分:秒」形式の文字列に変換
 */
const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) {
        return `${mins}:00`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const ConfigButtons: React.FC<ConfigButtonsProps> = ({
    totalRounds,
    workoutDuration,
    restDuration,
    onRoundPress,
    onTimePress,
    onRestPress,
    disabled = false,
}) => {
    return (
        <div className="flex justify-center gap-4 px-4 py-6">
            {/* === ROUND ボタン === */}
            <button
                onClick={onRoundPress}
                disabled={disabled}
                className={`
          btn-config
          flex flex-col items-center
          min-w-[80px]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500'}
        `}
                aria-label={`ラウンド数設定: 現在 ${totalRounds} ラウンド`}
            >
                <span className="text-gray-500 text-sm">ROUND</span>
                <span className="text-white text-2xl">{totalRounds}</span>
            </button>

            {/* === TIME ボタン === */}
            <button
                onClick={onTimePress}
                disabled={disabled}
                className={`
          btn-config
          flex flex-col items-center
          min-w-[80px]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500'}
        `}
                aria-label={`ワークアウト時間設定: 現在 ${formatDuration(workoutDuration)}`}
            >
                <span className="text-gray-500 text-sm">TIME</span>
                <span className="text-white text-2xl">{formatDuration(workoutDuration)}</span>
            </button>

            {/* === REST ボタン === */}
            <button
                onClick={onRestPress}
                disabled={disabled}
                className={`
          btn-config
          flex flex-col items-center
          min-w-[80px]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500'}
        `}
                aria-label={`休憩時間設定: 現在 ${formatDuration(restDuration)}`}
            >
                <span className="text-gray-500 text-sm">REST</span>
                <span className="text-white text-2xl">{formatDuration(restDuration)}</span>
            </button>
        </div>
    );
};

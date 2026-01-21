/**
 * Heavy Timer - コントロールボタンコンポーネント
 * 
 * 画面下部に配置される操作ボタン群：
 * - メイン再生/停止ボタン（中央・大）
 * - リセットボタン（左下）
 * - 設定ボタン（右下）
 * 
 * Lucide Reactを使用してアイコンを表示します。
 */

import React from 'react';
import { Play, Pause, Square, RotateCcw, Settings } from 'lucide-react';
import { TimerState } from '../hooks/useTimer';

interface ControlButtonsProps {
    state: TimerState;
    isPaused: boolean;        // 一時停止中かどうか
    onToggle: () => void;     // 再生/一時停止の切り替え
    onReset: () => void;      // リセット
    onSettings: () => void;   // 設定画面を開く
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
    state,
    isPaused,
    onToggle,
    onReset,
    onSettings,
}) => {
    /**
     * メインボタンに表示するアイコンを決定
     */
    const renderMainIcon = () => {
        if (state === 'finished') {
            // 完了時は停止アイコン
            return <Square size={48} className="text-white" fill="white" />;
        }
        if (state === 'idle' || isPaused) {
            // 停止中または一時停止中は再生アイコン
            return <Play size={48} className="text-white ml-2" fill="white" />;
        }
        // 動作中は一時停止アイコン
        return <Pause size={48} className="text-white" fill="white" />;
    };

    /**
     * メインボタンのグラデーション色を決定
     */
    const getMainButtonColor = () => {
        if (state === 'rest') {
            return 'from-red-800 to-red-900 border-red-600 shadow-red-900/50';
        }
        if (state === 'finished') {
            return 'from-yellow-700 to-yellow-800 border-yellow-600 shadow-yellow-900/50';
        }
        return 'from-green-800 to-green-900 border-green-600 shadow-green-900/50';
    };

    return (
        <div className="flex items-center justify-center gap-8 py-8">
            {/* === リセットボタン（左） === */}
            <button
                onClick={onReset}
                className="btn-control"
                aria-label="タイマーをリセット"
            >
                <RotateCcw size={24} className="text-gray-400" />
            </button>

            {/* === メインボタン（中央） === */}
            {/* 
        スタイル解説：
        - w-36 h-36: 大きめのサイズ（144px x 144px）
        - rounded-full: 完全な円形
        - bg-gradient-to-b: 上から下へのグラデーション
        - shadow-lg: 影で立体感を出す
        - active:scale-95: タップ時に少し縮む（フィードバック）
      */}
            <button
                onClick={onToggle}
                className={`
          w-36 h-36 
          rounded-full 
          flex items-center justify-center
          bg-gradient-to-b ${getMainButtonColor()}
          border-4
          shadow-lg
          active:scale-95 
          transition-all duration-150
          relative
          overflow-hidden
        `}
                aria-label={
                    state === 'idle' || isPaused
                        ? 'タイマーを開始'
                        : state === 'finished'
                            ? 'リセット'
                            : 'タイマーを一時停止'
                }
            >
                {/* 光沢効果（疑似要素的なオーバーレイ） */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
                {/* アイコン */}
                <div className="relative z-10">
                    {renderMainIcon()}
                </div>
            </button>

            {/* === 設定ボタン（右） === */}
            <button
                onClick={onSettings}
                className="btn-control"
                aria-label="設定を開く"
            >
                <Settings size={24} className="text-gray-400" />
            </button>
        </div>
    );
};

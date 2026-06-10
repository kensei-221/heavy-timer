/**
 * Heavy Timer - iOS風ホイールピッカーコンポーネント
 * 
 * iOSネイティブの「ドラムロール式ピッカー」を再現します。
 * 
 * 【特徴】
 * - 画面下部からスライドインするモーダル
 * - スクロールで値を選択（スナップ動作）
 * - 3列構成（分・区切り・秒）or 1列（ラウンド数）
 * 
 * 【技術ポイント】
 * - CSS scroll-snap で滑らかなスナップスクロールを実現
 * - IntersectionObserver で中央の要素を検出
 * - アニメーションは CSS transition で実装
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { playWheelTickSound } from '../utils/soundGenerator';

// ピッカーの種類
export type PickerType = 'rounds' | 'workout' | 'rest';

interface IOSPickerProps {
    isOpen: boolean;           // モーダルの開閉状態
    type: PickerType;          // ピッカーの種類
    currentValue: number;      // 現在の値（秒またはラウンド数）
    onConfirm: (value: number) => void;  // 決定時のコールバック
    onCancel: () => void;      // キャンセル時のコールバック
}

// ラウンド数の選択肢（1〜20）
const ROUND_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);

// 分の選択肢（Workout: 0〜120分）
const WORKOUT_MINUTE_OPTIONS = Array.from({ length: 121 }, (_, i) => i);

// 分の選択肢（Rest: 0〜60分）
const REST_MINUTE_OPTIONS = Array.from({ length: 61 }, (_, i) => i);

// 秒の選択肢（0, 10, 20, 30, 40, 50）
const SECOND_OPTIONS = [0, 10, 20, 30, 40, 50];

/**
 * 単一のホイール列コンポーネント
 */
interface WheelColumnProps {
    options: number[];
    selectedValue: number;
    onSelect: (value: number) => void;
    formatValue?: (value: number) => string;
}

const WheelColumn: React.FC<WheelColumnProps> = ({
    options,
    selectedValue,
    onSelect,
    formatValue = (v) => v.toString().padStart(2, '0'),
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    // 前回のスクロール位置インデックスを保持
    const lastIndexRef = useRef<number>(-1);

    // 選択された値の位置にスクロール
    useEffect(() => {
        const index = options.indexOf(selectedValue);
        if (index >= 0 && itemRefs.current[index]) {
            itemRefs.current[index]?.scrollIntoView({
                block: 'center',
                behavior: 'smooth',
            });
        }
    }, [selectedValue, options]);

    // スクロール位置から選択値を検出
    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const centerY = containerRect.top + containerRect.height / 2;

        // 中央に最も近いアイテムを探す
        let closestIndex = 0;
        let closestDistance = Infinity;

        itemRefs.current.forEach((ref, index) => {
            if (ref) {
                const rect = ref.getBoundingClientRect();
                const itemCenterY = rect.top + rect.height / 2;
                const distance = Math.abs(centerY - itemCenterY);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            }
        });

        if (options[closestIndex] !== selectedValue) {
            // ここでの音再生は削除（リアルタイム側で鳴らすため）
            onSelect(options[closestIndex]);
        }
    }, [options, selectedValue, onSelect]);

    // スクロールのデバウンス処理
    const scrollTimeoutRef = useRef<number | null>(null);

    // リアルタイムスクロールハンドラ
    const handleContainerScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const itemHeight = 40;

        // アイテムの中央に来たタイミングで鳴らす
        // パディング80pxを考慮しつつ、単純にscrollTop / 40 でインデックス変化を見る
        const currentIndex = Math.round(scrollTop / itemHeight);

        if (lastIndexRef.current !== currentIndex) {
            playWheelTickSound(0.15); // 回転音
            lastIndexRef.current = currentIndex;
        }

        // スナップ処理のデバウンス呼び出し
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = window.setTimeout(handleScroll, 100);
    }, [handleScroll]);

    return (
        <div
            ref={containerRef}
            className="h-[200px] w-24 shrink-0 overflow-y-scroll overflow-x-hidden picker-wheel relative"
            onScroll={handleContainerScroll}
            style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }}
        >
            {/* 上下のパディング（中央配置用） */}
            <div className="h-[80px]" />

            {options.map((option, index) => {
                const isSelected = option === selectedValue;
                return (
                    <div
                        key={option}
                        ref={(el) => { itemRefs.current[index] = el; }}
                        className={`
              picker-item
              h-[40px] flex items-center justify-center
              cursor-pointer
              transition-all duration-150
              ${isSelected
                                ? 'text-white text-4xl scale-110'
                                : 'text-gray-500 text-2xl'
                            }
            `}
                        onClick={() => {
                            onSelect(option);
                            itemRefs.current[index]?.scrollIntoView({
                                block: 'center',
                                behavior: 'smooth',
                            });
                        }}
                    >
                        {formatValue(option)}
                    </div>
                );
            })}

            {/* 下のパディング */}
            <div className="h-[80px]" />

            {/* CSSでスクロールバーを非表示 */}
            <style>{`
        .picker-wheel::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </div>
    );
};

export const IOSPicker: React.FC<IOSPickerProps> = ({
    isOpen,
    type,
    currentValue,
    onConfirm,
    onCancel,
}) => {
    // 内部状態：選択中の値
    const [tempValue, setTempValue] = useState(currentValue);
    const [tempMinutes, setTempMinutes] = useState(Math.floor(currentValue / 60));
    const [tempSeconds, setTempSeconds] = useState(currentValue % 60);

    // モーダルが開いたときに現在値で初期化
    useEffect(() => {
        if (isOpen) {
            setTempValue(currentValue);
            setTempMinutes(Math.floor(currentValue / 60));
            // 秒は10秒刻みの最も近い値にスナップ
            const rawSeconds = currentValue % 60;
            const snappedSeconds = Math.round(rawSeconds / 10) * 10;
            setTempSeconds(snappedSeconds >= 60 ? 50 : snappedSeconds);
        }
    }, [isOpen, currentValue]);

    // 決定ボタンのハンドラ
    const handleConfirm = () => {
        if (type === 'rounds') {
            onConfirm(tempValue);
        } else {
            // 分と秒を合計して秒数に変換
            onConfirm(tempMinutes * 60 + tempSeconds);
        }
    };

    // タイトルを取得
    const getTitle = (): string => {
        switch (type) {
            case 'rounds':
                return 'ラウンド数';
            case 'workout':
                return 'ワークアウト時間';
            case 'rest':
                return '休憩時間';
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* === オーバーレイ背景 === */}
            <div
                className="fixed inset-0 bg-black/60 picker-overlay z-40"
                onClick={onCancel}
            />

            {/* === ピッカーモーダル === */}
            <div
                className={`
          fixed bottom-0 left-0 right-0
          bg-gray-900 rounded-t-3xl
          z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          safe-area-bottom
        `}
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                {/* === ヘッダー === */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
                    {/* キャンセルボタン */}
                    <button
                        onClick={onCancel}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        aria-label="キャンセル"
                    >
                        <X size={24} />
                    </button>

                    {/* タイトル */}
                    <h2 className="text-white text-xl font-vt323">
                        {getTitle()}
                    </h2>

                    {/* 決定ボタン */}
                    <button
                        onClick={handleConfirm}
                        className="p-2 text-green-400 hover:text-green-300 transition-colors"
                        aria-label="決定"
                    >
                        <Check size={24} />
                    </button>
                </div>

                {/* === ホイール部分 === */}
                <div className="relative px-4 py-4">
                    {/* 選択インジケーター（中央のハイライト） */}
                    <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[44px] bg-gray-800/50 rounded-lg pointer-events-none border border-gray-700" />

                    {type === 'rounds' ? (
                        // === ラウンド数ピッカー（1列）===
                        <div className="flex justify-center">
                            <WheelColumn
                                options={ROUND_OPTIONS}
                                selectedValue={tempValue}
                                onSelect={setTempValue}
                                formatValue={(v) => v.toString()}
                            />
                            <div className="h-[200px] flex items-center px-4">
                                <span className="text-gray-400 text-xl">ラウンド</span>
                            </div>
                        </div>
                    ) : (
                        // === 時間ピッカー（3列：分・区切り・秒）===
                        <div className="flex justify-center items-center">
                            {/* 分 */}
                            {/* 分 */}
                            <WheelColumn
                                options={type === 'workout' ? WORKOUT_MINUTE_OPTIONS : REST_MINUTE_OPTIONS}
                                selectedValue={tempMinutes}
                                onSelect={setTempMinutes}
                                formatValue={(v) => v.toString()}
                            />

                            {/* 区切り「:」 */}
                            <div className="h-[200px] flex items-center px-2">
                                <span className="text-white text-4xl">:</span>
                            </div>

                            {/* 秒 */}
                            <WheelColumn
                                options={SECOND_OPTIONS}
                                selectedValue={tempSeconds}
                                onSelect={setTempSeconds}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

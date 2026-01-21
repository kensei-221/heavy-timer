/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                // VT323: レトロなドットマトリクス風のデジタルフォント
                vt323: ['VT323', 'monospace'],
                // DSEG7: 7セグメントLEDディスプレイ風フォント
                dseg7: ['DSEG7 Classic', 'monospace'],
                // Chakra Petch: 角ばった近未来風
                chakra: ['Chakra Petch', 'sans-serif'],
            },
            colors: {
                // カスタムカラーパレット
                'timer-bg': '#0a0a0a',        // 背景：ほぼ黒
                'neon-green': '#00ff00',       // ネオングリーン（ワークアウト時）
                'neon-red': '#ff3333',         // 赤（休憩時）
                'button-border': '#333333',    // ボタン枠線
            },
            // LEDグロー効果用のカスタムシャドウ
            textShadow: {
                'glow-green': '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 40px #00ff00',
                'glow-red': '0 0 10px #ff3333, 0 0 20px #ff3333, 0 0 40px #ff3333',
            },
        },
    },
    plugins: [],
}

/**
 * Heavy Timer Sound Generator
 * Web Audio APIを使用したサウンド生成 (最終決定版)
 *
 * 1. 開始音: ボクシングゴング (gong-start.mp3 を再生)
 * 2. 終了音: Piri Piri (V4 #1ベース)
 * 3. 警告音: Kabuki Hyoshigi (B9ベース改・轟音拍子木)
 */

let audioContext: AudioContext | null = null;
let audioUnlocked = false;

// AudioContextの取得と初期化
export const getAudioContext = (): AudioContext => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

// === 開始音（MP3）の読み込み・キャッシュ ===

// デコード済みの開始音バッファ（一度読み込んだら使い回す）
let startSoundBuffer: AudioBuffer | null = null;
// 読み込み中のPromise（多重フェッチ防止）
let startSoundLoading: Promise<AudioBuffer> | null = null;

// base ('./') を考慮した開始音のURL
const START_SOUND_URL = `${import.meta.env.BASE_URL}gong-start.mp3`;

/**
 * 開始音MP3をフェッチしてデコードする（結果はキャッシュ）
 * デコードはユーザー操作前（suspended状態）でも可能なので、
 * アプリ起動時に先読みしておくと初回タップで遅延なく鳴らせる。
 */
export const loadStartSound = (): Promise<AudioBuffer> => {
    if (startSoundBuffer) return Promise.resolve(startSoundBuffer);
    if (startSoundLoading) return startSoundLoading;

    const ctx = getAudioContext();
    startSoundLoading = fetch(START_SOUND_URL)
        .then(res => res.arrayBuffer())
        .then(
            arr =>
                new Promise<AudioBuffer>((resolve, reject) => {
                    // Safari互換のためコールバック形式のdecodeAudioDataを使用
                    ctx.decodeAudioData(arr, resolve, reject);
                })
        )
        .then(decoded => {
            startSoundBuffer = decoded;
            return decoded;
        });

    return startSoundLoading;
};

/**
 * AudioContextのアンロック（ユーザー操作内で「同期的に」呼び出す）
 *
 * iOS Safari / PWA では、AudioContextはユーザー操作のハンドラ内で
 * 同期的に resume() し、かつ一度何か音を鳴らさないとアンロックされない。
 * await を挟むとユーザー操作のコンテキストが切れて無音になるため、
 * ここでは Promise を待たずに同期的に resume と無音バッファ再生を行う。
 */
export const unlockAudio = (): void => {
    const ctx = getAudioContext();

    // 停止中なら再開（await しない）
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    // 無音バッファを一度鳴らしてアンロック（iOS対策・初回のみ）
    if (!audioUnlocked) {
        const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        audioUnlocked = true;
    }

    // 開始音MP3を先読み（初回タップで遅延なく鳴らすため）
    loadStartSound().catch(() => {
        /* 読み込み失敗時は再生時に再試行する */
    });
};

// AudioContextの再開（ユーザー操作で呼び出す）
export const resumeAudioContext = async (): Promise<void> => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        await ctx.resume();
    }
};

// 歪みカーブ生成（音圧アップ用）
function makeDistortionCurve(amount: number) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve as any;
}

/**
 * 1. 開始音: ボクシングゴング (gong-start.mp3)
 * 読み込み済みのMP3バッファを音量調整して再生する。
 * 未読み込みの場合はその場で読み込んでから再生する。
 */
const playBuffer = (buffer: AudioBuffer, volume: number): void => {
    const ctx = getAudioContext();
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
};

export const playStartNotification = (volume: number = 1.0): void => {
    if (startSoundBuffer) {
        playBuffer(startSoundBuffer, volume);
        return;
    }

    // まだ読み込めていなければ読み込んでから再生（初回のみ僅かに遅延）
    loadStartSound()
        .then(buffer => playBuffer(buffer, volume))
        .catch(() => {
            /* 読み込み失敗時は無音 */
        });
};

/**
 * 2. 終了音: Piri Piri (V4 #1 Refined)
 * 900Hz, 15Hz, Duty 20%
 */
export const playEndNotification = (volume: number = 1.0): void => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const freq = 900;
    const speed = 15;
    const count = 15; // 約1秒間
    const duty = 0.2;

    const interval = 1 / speed;
    const duration = interval * duty;

    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);

    for (let i = 0; i < count; i++) {
        const t = now + i * interval;
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth'; // 鋸歯状波で鋭く
        osc.frequency.value = freq;

        // LPFで少しだけ角を取るが、鋭さは残す
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = freq * 4;

        const gain = ctx.createGain();
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.8, t + 0.003);
        gain.gain.setValueAtTime(0.8, t + duration * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.start(t);
        osc.stop(t + duration + 0.05);
    }
};

/**
 * 3. 警告音: Kabuki Hyoshigi (B9 Boosted)
 * Group B (Noise Resonator) #9 をベースに音圧最大化
 * けたたましく、終了音と対等に渡り合える音量
 */
export const playWarningNotification = (volume: number = 1.0): void => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // B9 Param (推測): Freq 1600Hz, Q 40
    const f = 1600;
    const Q = 40;
    const decay = 0.35;

    const master = ctx.createGain();

    // Distortionで音圧を稼ぐ
    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(20); // 軽い歪みでパンチを出す
    master.connect(shaper);
    shaper.connect(ctx.destination);
    master.gain.value = volume;

    const playHit = (time: number) => {
        const noise = ctx.createBufferSource();
        const b = ctx.createBuffer(1, ctx.sampleRate * decay, ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        noise.buffer = b;

        // 強烈な共振フィルタ
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = f;
        filter.Q.value = Q;

        const gain = ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        // アタックを限界まで速く、減衰は自然に
        gain.gain.setValueAtTime(1.0, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + decay);

        noise.start(time);
        noise.stop(time + decay + 0.1);

        // 隠し味：アタックの芯（Sine波）を追加して「堅さ」を強調
        const click = ctx.createOscillator();
        click.frequency.value = 2000;
        const cGain = ctx.createGain();
        click.connect(cGain); cGain.connect(master);
        cGain.gain.setValueAtTime(0.5, time);
        cGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
        click.start(time); click.stop(time + 0.05);
    };

    // 「カーン！・・・カーン！」と2回
    playHit(now);
    playHit(now + 0.35); // 間もしっかり取る
};

// 互換性のためのエイリアス
export const playWoodBlock = (v: number) => playWarningNotification(v);
export const playBuzzer = (v: number, type: 'start' | 'end' = 'start') => {
    if (type === 'end') playEndNotification(v);
    else playStartNotification(v);
};

export const playBeep = (volume: number = 0.2, frequency: number = 880): void => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = frequency;
    const gainNode = ctx.createGain();
    osc.connect(gainNode); gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
};

// UI操作音：ドラムロールの「カリカリ」音
export const playWheelTickSound = (volume: number = 0.3): void => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 極短のノイズバーストで「チッ」という音を作る
    const bufferSize = ctx.sampleRate * 0.005; // 5ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() - 0.5) * 2;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // ハイパスフィルターで「カリ」感を出す
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const gain = ctx.createGain();

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // 音量エンベロープ
    gain.gain.setValueAtTime(volume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.005);

    noise.start(now);
};

// UI操作音：メニューを開くときの「ポッ」（和音）
export const playMenuOpenSound = (volume: number = 0.3): void => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = volume * 0.5;
    master.connect(ctx.destination);

    // メジャーコードの高音で「ポロン」と鳴らす
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5

    freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;

        const g = ctx.createGain();
        osc.connect(g);
        g.connect(master);

        const t = now + i * 0.03; // 少しずらす
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(1, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.start(t);
        osc.stop(t + 0.35);
    });
};

// UI操作音（クリック/選択）
export const playClickSound = (volume: number = 0.3): void => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 短く鋭い「ピ」
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 1200;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3000;

    const gain = ctx.createGain();

    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);

    gain.gain.setValueAtTime(volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.start(now); osc.stop(now + 0.05);
};

/**
 * Sound effects synthesised with WebAudio: no audio files, works offline.
 * The AudioContext is created lazily on the first user gesture (browser/WebView policy).
 */
export class Sound {
  enabled = true;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  /** Call from a user gesture. */
  unlock(): void {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private ready(): boolean {
    return this.enabled && !!this.ctx && !!this.master && this.ctx.state === 'running';
  }

  private tone(freq: number, end: number, dur: number, type: OscillatorType, vol: number, delay = 0): void {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, end), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.master!);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, vol: number, lowpass: number): void {
    const ctx = this.ctx!;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lowpass;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.master!);
    src.start();
  }

  /** Steering tap: short rising blip. */
  tap(): void {
    if (!this.ready()) return;
    this.tone(320, 520, 0.07, 'triangle', 0.18);
  }

  /** Start of a run. */
  start(): void {
    if (!this.ready()) return;
    this.tone(440, 660, 0.09, 'triangle', 0.16);
  }

  /** Off the road: noise burst + low thud. */
  crash(): void {
    if (!this.ready()) return;
    this.noise(0.45, 0.5, 1800);
    this.tone(140, 45, 0.35, 'sawtooth', 0.35);
  }

  /** New record: rising arpeggio. */
  record(): void {
    if (!this.ready()) return;
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, f, 0.22, 'square', 0.12, i * 0.1));
  }
}

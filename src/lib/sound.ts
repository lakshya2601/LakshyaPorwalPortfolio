// Ambient sound made with the Web Audio API — no audio files needed.
// Wind (filtered brown noise) that grows with altitude + campfire crackles.
import { store } from "./store";

class Ambience {
  private ctx?: AudioContext;
  private master?: GainNode;
  private wind?: GainNode;
  private crackleTimer?: number;
  private raf?: number;
  enabled = false;

  start() {
    if (!this.ctx) this.build();
    this.ctx!.resume();
    this.enabled = true;
    this.master!.gain.setTargetAtTime(0.9, this.ctx!.currentTime, 0.8);
  }

  stop() {
    if (!this.ctx) return;
    this.enabled = false;
    this.master!.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
  }

  toggle() {
    if (this.enabled) this.stop();
    else this.start();
    return this.enabled;
  }

  private noiseBuffer(ctx: AudioContext, seconds: number, brown: boolean) {
    const len = ctx.sampleRate * seconds;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  }

  private build() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // wind
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, 6, true);
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(lp.frequency);
    this.wind = ctx.createGain();
    this.wind.gain.value = 0.25;
    src.connect(lp).connect(this.wind).connect(this.master);
    src.start();
    lfo.start();

    // crackles
    const white = this.noiseBuffer(ctx, 0.2, false);
    const crackle = () => {
      const p = store.progress;
      const fire = p > 0.15 && p < 0.7 ? 1 : 0.25;
      if (this.enabled && Math.random() < 0.6 * fire) {
        const s = ctx.createBufferSource();
        s.buffer = white;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1500 + Math.random() * 2500;
        const g = ctx.createGain();
        const now = ctx.currentTime;
        g.gain.setValueAtTime(0.05 + Math.random() * 0.12 * fire, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04 + Math.random() * 0.06);
        s.connect(bp).connect(g).connect(this.master!);
        s.start(now, Math.random() * 0.1, 0.1);
      }
      this.crackleTimer = window.setTimeout(crackle, 60 + Math.random() * 260);
    };
    crackle();

    // wind gets stronger as you climb, softer in space
    const tick = () => {
      const p = store.progress;
      const level = p < 0.7 ? 0.2 + p * 0.7 : 0.69 * (1 - (p - 0.7) / 0.3) + 0.08;
      this.wind!.gain.setTargetAtTime(level, ctx.currentTime, 0.5);
      this.raf = requestAnimationFrame(tick);
    };
    tick();
  }
}

export const ambience = new Ambience();

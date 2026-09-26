export class AudioManager {
  constructor() {
    this.muted = false;
    this.ctx = null;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  async ensureContext() {
    if (this.ctx || this.muted) return;
    this.ctx = new window.AudioContext();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  async beep(type = 'ui') {
    if (this.muted) return;
    await this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const tones = {
      ui: { frequency: 430, duration: 0.08 },
      collect: { frequency: 620, duration: 0.12 },
      hit: { frequency: 220, duration: 0.15 },
      win: { frequency: 760, duration: 0.2 },
    };

    const { frequency, duration } = tones[type] ?? tones.ui;
    osc.frequency.value = frequency;
    osc.type = 'triangle';
    gain.gain.value = 0.001;
    gain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration + 0.02);
  }
}

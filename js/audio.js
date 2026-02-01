// audio.js — Sound-Effekte via Web Audio API (programmatisch synthetisiert)

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.thrustNode = null;
        this.thrustGain = null;
        this.isThrusting = false;
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
    }

    play(sound, param) {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        switch (sound) {
            case 'shoot': this._playShoot(); break;
            case 'explosion': this._playExplosion(param); break;
            case 'shipExplosion': this._playShipExplosion(); break;
            case 'levelUp': this._playLevelUp(); break;
            case 'gameOver': this._playGameOver(); break;
        }
    }

    setThrust(active) {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        if (active && !this.isThrusting) {
            this._startThrust();
        } else if (!active && this.isThrusting) {
            this._stopThrust();
        }
    }

    _playShoot() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    _playExplosion(size) {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Duration and filter frequency vary by asteroid size
        const config = {
            large:  { duration: 0.4, freq: 200,  vol: 0.25 },
            medium: { duration: 0.3, freq: 400,  vol: 0.2 },
            small:  { duration: 0.2, freq: 800,  vol: 0.15 },
        };
        const cfg = config[size] || config.medium;

        const bufferSize = ctx.sampleRate * cfg.duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cfg.freq, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + cfg.duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(cfg.vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + cfg.duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + cfg.duration);
    }

    _playShipExplosion() {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const duration = 0.6;

        // Noise burst
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + duration);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + duration);

        // Low frequency sweep
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + duration);
        oscGain.gain.setValueAtTime(0.2, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    _startThrust() {
        const ctx = this.ctx;
        this.isThrusting = true;

        // Create looping noise for thrust
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();

        this.thrustNode = noise;
        this.thrustGain = gain;
    }

    _stopThrust() {
        this.isThrusting = false;
        if (this.thrustGain && this.thrustNode) {
            const ctx = this.ctx;
            this.thrustGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
            const node = this.thrustNode;
            window.setTimeout(() => {
                try { node.stop(); } catch (e) { void e; }
            }, 100);
            this.thrustNode = null;
            this.thrustGain = null;
        }
    }

    _playLevelUp() {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const notes = [330, 440, 550, 660];

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;

            const start = now + i * 0.1;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.12);
        });
    }

    _playGameOver() {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const notes = [440, 370, 300, 220];

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            const start = now + i * 0.2;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.25);
        });
    }
}

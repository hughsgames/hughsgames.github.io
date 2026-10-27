// Polis World (computer version): all the sound in the game.
//
// There are no sound files anywhere. Every note and every knock is made in the browser with the Web Audio API,
// which means nothing to download, nothing to pay for and nothing to go missing. The music is built the same way
// a musician would: each land has its own scale, its own instruments and its own drum, and a tune is improvised
// from them while you're there. Walk from Athens to Babylon and the music changes with the country.
//
// The browser will not let a page make a sound until the player has clicked something, so start() is called from
// the Play button.

const SR_HINT = 44100;

// ---------- the scales each land plays in ----------
// Steps in semitones from the root. These are the real modes those places used, as far as anyone can tell.
const MODES = {
  dorian: [0, 2, 3, 5, 7, 9, 10],            // Greek: calm and open
  phrygian: [0, 1, 3, 5, 7, 8, 10],          // Greek again, darker
  lydian: [0, 2, 4, 6, 7, 9, 11],            // bright, used for Rome
  hijaz: [0, 1, 4, 5, 7, 8, 10],             // the Middle East: Babylon, Persia, Jerusalem
  pentatonic: [0, 2, 4, 7, 9],               // China
  minorPent: [0, 3, 5, 7, 10],               // Mesoamerica
  bhairav: [0, 1, 4, 5, 7, 8, 11],           // India and Angkor
  egyptian: [0, 2, 5, 7, 10],                // a suspended pentatonic, for the Nile
  wholeTone: [0, 2, 4, 6, 8, 10],            // Atlantis: nowhere on earth
};

// voice: how the melody is plucked or blown. drumKind: what keeps time.
export const LANDS = {
  wild:     { name: 'the open country', mode: 'dorian',     root: 196.00, voice: 'flute', drone: 0.10, bpm: 58, drum: null,    drumEvery: 0, density: 0.30, octave: 1 },
  greece:   { name: 'Greece',           mode: 'dorian',     root: 220.00, voice: 'lyre',  drone: 0.16, bpm: 92, drum: 'frame', drumEvery: 4, density: 0.62, octave: 1 },
  rome:     { name: 'Rome',             mode: 'lydian',     root: 174.61, voice: 'pipe',  drone: 0.18, bpm: 104, drum: 'tabor', drumEvery: 2, density: 0.60, octave: 1 },
  egypt:    { name: 'Egypt',            mode: 'egyptian',   root: 196.00, voice: 'harp',  drone: 0.14, bpm: 76, drum: 'frame', drumEvery: 4, density: 0.55, octave: 1 },
  babylon:  { name: 'Mesopotamia',      mode: 'hijaz',      root: 207.65, voice: 'lyre',  drone: 0.20, bpm: 84, drum: 'frame', drumEvery: 4, density: 0.58, octave: 1 },
  persia:   { name: 'Persia',           mode: 'hijaz',      root: 185.00, voice: 'reed',  drone: 0.22, bpm: 88, drum: 'tabor', drumEvery: 2, density: 0.62, octave: 1 },
  india:    { name: 'India',            mode: 'bhairav',    root: 164.81, voice: 'sitar', drone: 0.24, bpm: 72, drum: 'tabla', drumEvery: 2, density: 0.66, octave: 1 },
  china:    { name: 'China',            mode: 'pentatonic', root: 246.94, voice: 'zither',drone: 0.10, bpm: 80, drum: 'woodblock', drumEvery: 4, density: 0.58, octave: 1 },
  mexico:   { name: 'Teotihuacan',      mode: 'minorPent',  root: 174.61, voice: 'ocarina', drone: 0.12, bpm: 70, drum: 'log', drumEvery: 2, density: 0.50, octave: 1 },
  levant:   { name: 'Jerusalem',        mode: 'hijaz',      root: 220.00, voice: 'harp',  drone: 0.18, bpm: 78, drum: 'frame', drumEvery: 4, density: 0.56, octave: 1 },
  carthage: { name: 'Carthage',         mode: 'phrygian',   root: 196.00, voice: 'reed',  drone: 0.18, bpm: 96, drum: 'tabor', drumEvery: 2, density: 0.60, octave: 1 },
  atlantis: { name: 'Atlantis',         mode: 'wholeTone',  root: 261.63, voice: 'bell',  drone: 0.26, bpm: 54, drum: null,    drumEvery: 0, density: 0.44, octave: 1 },
  night:    { name: 'the night',        mode: 'phrygian',   root: 146.83, voice: 'flute', drone: 0.18, bpm: 50, drum: null,    drumEvery: 0, density: 0.36, octave: 1 },
};

// Which land each city belongs to. (The keys are the city ids the game already uses.)
export const CITY_LAND = {
  rome: 'rome',
  athens: 'greece', olympia: 'greece', alexandria: 'greece',   // Alexandria was a Greek city, in Egypt
  giza: 'egypt',
  babylon: 'babylon',
  persepolis: 'persia',
  mohenjoDaro: 'india', angkor: 'india',
  forbiddenCity: 'china', wei: 'china', shu: 'china', wu: 'china', greatWall: 'china',
  teotihuacan: 'mexico',
  jerusalem: 'levant',
  carthage: 'carthage',
  atlantis: 'atlantis',
};

const semitone = (n) => Math.pow(2, n / 12);

export class Sound {
  constructor() {
    this.ctx = null;
    this.on = localStorage.getItem('polis-sound') !== 'off';
    this.musicOn = localStorage.getItem('polis-music') !== 'off';
    this.land = null;
    this.nextLand = null;
    this.beat = 0;
    this.nextNoteAt = 0;
    this.phrase = 0;
    this.started = false;
    this.lastStep = -1;
  }

  /// Called from the Play button: browsers only allow sound after a click.
  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const c = this.ctx;

    // Everything goes through here, so one knob turns the whole game down.
    this.master = c.createGain();
    this.master.gain.value = this.on ? 0.9 : 0;
    this.master.connect(c.destination);

    // A little room to play in: a short hand-made echo, so notes don't sound like they're in a box.
    this.room = c.createConvolver();
    this.room.buffer = this.makeRoom(1.6, 2.4);
    this.roomGain = c.createGain(); this.roomGain.gain.value = 0.3;
    this.room.connect(this.roomGain); this.roomGain.connect(this.master);

    this.sfx = c.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
    const sfxRoom = c.createGain(); sfxRoom.gain.value = 0.18; this.sfx.connect(sfxRoom); sfxRoom.connect(this.room);

    this.music = c.createGain(); this.music.gain.value = this.musicOn ? 0.5 : 0; this.music.connect(this.master);
    const musicRoom = c.createGain(); musicRoom.gain.value = 0.55; this.music.connect(musicRoom); musicRoom.connect(this.room);

    // The bed of sound under everything: wind, and the sea when you're near it.
    this.bedGain = c.createGain(); this.bedGain.gain.value = 0; this.bedGain.connect(this.master);
    this.wind = this.makeWind();
    this.rain = this.makeRain();
    this.started = true;
    this.nextNoteAt = c.currentTime + 0.2;
  }

  /// A short burst of decaying noise makes a believable room echo.
  makeRoom(seconds, decay) {
    const c = this.ctx, n = Math.floor(c.sampleRate * seconds), buf = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return buf;
  }

  /// Four seconds of noise, looped and filtered: wind over the hills, waves on a beach.
  noiseLoop(seconds = 4) {
    const c = this.ctx, n = Math.floor(c.sampleRate * seconds), buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = last * 0.86 + w * 0.14; d[i] = last * 3.2; }
    // Make the ends meet so the loop doesn't click.
    const fade = Math.floor(c.sampleRate * 0.25);
    for (let i = 0; i < fade; i++) { const f = i / fade; d[i] = d[i] * f + d[n - fade + i] * (1 - f); }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true; src.start();
    return src;
  }

  /// Rain: a wide hiss of noise, with a lower rumble underneath for heavy rain, both held at zero
  /// until the weather turns. Indoors it is muffled rather than silenced, the way real rain on a roof is.
  makeRain() {
    const c = this.ctx;
    const src = this.noiseLoop(5);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1100; hp.Q.value = 0.4;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
    const g = c.createGain(); g.gain.value = 0;
    src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(this.master);
    // A soft patter underneath, so heavy rain has some weight to it.
    const src2 = this.noiseLoop(4);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.7;
    const g2 = c.createGain(); g2.gain.value = 0;
    src2.connect(bp); bp.connect(g2); g2.connect(this.master);
    return { g, g2, lp };
  }

  /// How hard it is raining (0 to 1) and how much of the sky you can see (1 outdoors, less under a roof).
  setRain(amount, openness = 1) {
    if (!this.ctx || !this.rain) return;
    const t = this.ctx.currentTime;
    const a = this.on ? Math.max(0, Math.min(amount, 1)) : 0;
    this.rain.g.gain.setTargetAtTime(a * 0.09 * (0.3 + 0.7 * openness), t, 1.0);
    this.rain.g2.gain.setTargetAtTime(a * a * 0.05, t, 1.4);
    // Under a roof the hiss loses its top end and turns into a drumming.
    this.rain.lp.frequency.setTargetAtTime(900 + 6100 * openness, t, 1.2);
  }

  makeWind() {
    const c = this.ctx;
    const src = this.noiseLoop(5);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = 0.6;
    const g = c.createGain(); g.gain.value = 0.5;
    src.connect(bp); bp.connect(g); g.connect(this.bedGain);
    // The wind rises and falls on its own.
    const lfo = c.createOscillator(); lfo.frequency.value = 0.06;
    const lg = c.createGain(); lg.gain.value = 0.35;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    return { bp, g };
  }

  setOn(sound, music) {
    this.on = sound; this.musicOn = music;
    localStorage.setItem('polis-sound', sound ? 'on' : 'off');
    localStorage.setItem('polis-music', music ? 'on' : 'off');
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(sound ? 0.9 : 0, t, 0.1);
    this.music.gain.setTargetAtTime(music && sound ? 0.5 : 0, t, 0.3);
  }

  /// How loud the wind and sea are right now (0 when you're indoors or underground).
  setBed(level, sea) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.bedGain.gain.setTargetAtTime(level * 0.16, t, 1.2);
    if (this.wind) this.wind.bp.frequency.setTargetAtTime(sea ? 260 : 520, t, 2.0);
  }

  // ---------- the little sounds things make ----------

  /// One note: an oscillator with an envelope, which is all most game sounds are.
  tone(freq, { type = 'sine', dur = 0.18, gain = 0.3, attack = 0.005, slideTo = 0, when = 0, dest = null } = {}) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = (when || c.currentTime);
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx);
    o.start(t); o.stop(t + dur + 0.02);
  }

  /// A knock, a crunch, a splash: filtered noise with an envelope.
  noise(freq, { dur = 0.16, gain = 0.3, q = 1, type = 'bandpass', sweepTo = 0, when = 0, dest = null } = {}) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = (when || c.currentTime);
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest || this.sfx);
    src.start(t); src.stop(t + dur);
  }

  /// Every sound the game asks for by name. Materials change the sound of digging and walking.
  play(what, arg) {
    if (!this.ctx || !this.on) return;
    const r = (a, b) => a + Math.random() * (b - a);
    switch (what) {
      case 'dig':        // chipping away at a block
        if (arg === 'stone') this.noise(1400, { dur: 0.09, gain: 0.3, q: 1.6, sweepTo: 700 });
        else if (arg === 'wood') this.noise(620, { dur: 0.11, gain: 0.3, q: 2.2, sweepTo: 320 });
        else if (arg === 'sand') this.noise(2600, { dur: 0.12, gain: 0.16, q: 0.5, type: 'highpass' });
        else this.noise(420, { dur: 0.1, gain: 0.26, q: 1.1, sweepTo: 240 });
        break;
      case 'break':      // the block finally gives way
        this.noise(900, { dur: 0.22, gain: 0.34, q: 0.8, sweepTo: 180 });
        this.tone(r(160, 220), { type: 'triangle', dur: 0.14, gain: 0.12, slideTo: 80 });
        break;
      case 'place':
        this.noise(700, { dur: 0.1, gain: 0.3, q: 1.4, sweepTo: 400 });
        this.tone(r(300, 360), { type: 'triangle', dur: 0.08, gain: 0.1, slideTo: 200 });
        break;
      case 'chop':
        this.noise(560, { dur: 0.18, gain: 0.5, q: 0.9, sweepTo: 180 });
        this.tone(150, { type: 'triangle', dur: 0.12, gain: 0.1, slideTo: 90 });
        break;
      case 'step': {   // a footfall, no more often than a person can walk
        const now = this.ctx.currentTime;
        if (now - this.lastStep < 0.22) return;
        this.lastStep = now;
        const f = arg === 'stone' ? 900 : arg === 'sand' ? 2200 : arg === 'wood' ? 600 : 500;
        this.noise(f * r(0.9, 1.1), { dur: 0.08, gain: arg === 'sand' ? 0.3 : 0.4, q: 0.8 });
        break;
      }
      case 'hoof': {
        const now = this.ctx.currentTime;
        if (now - this.lastStep < 0.17) return;
        this.lastStep = now;
        this.noise(300 * r(0.9, 1.15), { dur: 0.12, gain: 0.6, q: 1.6, sweepTo: 140 });
        break;
      }
      case 'jump': this.tone(330, { type: 'sine', dur: 0.12, gain: 0.16, slideTo: 480 }); break;
      case 'land': this.noise(320, { dur: 0.13, gain: 0.45, q: 0.7, sweepTo: 130 }); break;
      case 'splash':
        this.noise(1800, { dur: 0.35, gain: 0.3, q: 0.4, type: 'lowpass', sweepTo: 300 });
        this.tone(520, { type: 'sine', dur: 0.22, gain: 0.08, slideTo: 180 });
        break;
      case 'swim': this.noise(1100, { dur: 0.3, gain: 0.5, q: 0.4, type: 'lowpass', sweepTo: 400 }); break;
      case 'eat':
        this.noise(760, { dur: 0.1, gain: 0.55, q: 1.1 });
        this.noise(520, { dur: 0.09, gain: 0.45, q: 1.1, when: this.ctx.currentTime + 0.14 });
        break;
      case 'drink': this.tone(400, { type: 'sine', dur: 0.3, gain: 0.14, slideTo: 700 }); break;
      case 'craft':   // a hammer on an anvil
        this.tone(1180, { type: 'square', dur: 0.1, gain: 0.08 });
        this.noise(2200, { dur: 0.14, gain: 0.14, q: 3 });
        this.tone(590, { type: 'triangle', dur: 0.3, gain: 0.1 });
        break;
      case 'smelt': this.noise(400, { dur: 0.6, gain: 0.6, q: 0.5, type: 'lowpass', sweepTo: 1200 }); break;
      case 'pickup': this.tone(880, { type: 'triangle', dur: 0.08, gain: 0.14, slideTo: 1320 }); break;
      case 'click': this.tone(1200, { type: 'square', dur: 0.03, gain: 0.07 }); break;
      case 'door': this.noise(300, { dur: 0.34, gain: 0.7, q: 1.6, sweepTo: 520 }); this.tone(130, { type: 'triangle', dur: 0.2, gain: 0.07, slideTo: 95 }); break;
      case 'hit':   // you hit an animal
        this.noise(420, { dur: 0.13, gain: 0.3, q: 1.4, sweepTo: 200 });
        this.tone(200, { type: 'square', dur: 0.1, gain: 0.1, slideTo: 120 });
        break;
      case 'hurt':  // something hit you
        this.tone(320, { type: 'sawtooth', dur: 0.28, gain: 0.2, slideTo: 110 });
        this.noise(600, { dur: 0.2, gain: 0.16, q: 0.8, sweepTo: 200 });
        break;
      case 'star': {   // you earned a star
        const base = 523.25;
        [0, 4, 7, 12].forEach((s, i) => this.tone(base * semitone(s), { type: 'triangle', dur: 0.5, gain: 0.16, when: this.ctx.currentTime + i * 0.09 }));
        break;
      }
      case 'discover': {   // a wonder, or something new to learn
        const base = 392;
        [0, 7, 12, 16, 19].forEach((s, i) => this.tone(base * semitone(s), { type: 'sine', dur: 0.9, gain: 0.13, when: this.ctx.currentTime + i * 0.13 }));
        break;
      }
      case 'tame': {
        [0, 5, 9].forEach((s, i) => this.tone(440 * semitone(s), { type: 'sine', dur: 0.4, gain: 0.14, when: this.ctx.currentTime + i * 0.1 }));
        break;
      }
      case 'boat': this.noise(260, { dur: 0.5, gain: 0.7, q: 1.4, sweepTo: 120 }); break;
      case 'no': this.tone(220, { type: 'square', dur: 0.14, gain: 0.1, slideTo: 165 }); break;
      case 'bleat': this.tone(r(380, 460), { type: 'sawtooth', dur: 0.4, gain: 0.1, slideTo: r(260, 320) }); break;
      case 'growl': this.tone(r(90, 120), { type: 'sawtooth', dur: 0.6, gain: 0.16, slideTo: r(60, 80) }); break;
      case 'bird': {
        const f = r(1800, 2600);
        this.tone(f, { type: 'sine', dur: 0.08, gain: 0.14, slideTo: f * 1.4 });
        this.tone(f * 1.2, { type: 'sine', dur: 0.07, gain: 0.11, slideTo: f * 0.9, when: this.ctx.currentTime + 0.1 });
        break;
      }
      case 'cricket': this.noise(4600, { dur: 0.05, gain: 0.45, q: 9 }); this.noise(4600, { dur: 0.05, gain: 0.35, q: 9, when: this.ctx.currentTime + 0.08 }); break;
    }
  }

  // ---------- the music ----------

  /// Which land's music to play. Pass null for the open country.
  setLand(id) {
    const want = id && LANDS[id] ? id : 'wild';
    if (want === this.land) return;
    this.nextLand = want;
  }

  /// One note of the melody, played on that land's instrument.
  voiceNote(freq, dur, gain, at, voice) {
    const c = this.ctx, dest = this.music;
    switch (voice) {
      case 'lyre': case 'harp': case 'zither': case 'sitar': {
        // Plucked: a bright attack that dies away, plus a quiet octave above for shimmer.
        this.tone(freq, { type: 'triangle', dur: dur * 1.6, gain, attack: 0.004, when: at, dest });
        this.tone(freq * 2, { type: 'sine', dur: dur * 0.8, gain: gain * 0.3, attack: 0.004, when: at, dest });
        if (voice === 'sitar') this.tone(freq * 1.5, { type: 'sawtooth', dur: dur * 0.5, gain: gain * 0.12, when: at, dest });
        break;
      }
      case 'bell': {
        this.tone(freq, { type: 'sine', dur: dur * 3, gain, attack: 0.01, when: at, dest });
        this.tone(freq * 2.76, { type: 'sine', dur: dur * 1.6, gain: gain * 0.22, attack: 0.01, when: at, dest });
        break;
      }
      case 'reed': case 'pipe': case 'flute': case 'ocarina': {
        // Blown: a slower start and a steadier note.
        const soft = voice === 'flute' || voice === 'ocarina';
        this.tone(freq, { type: soft ? 'sine' : 'sawtooth', dur: dur * 1.1, gain: gain * (soft ? 1.1 : 0.55), attack: soft ? 0.08 : 0.03, when: at, dest });
        if (!soft) this.tone(freq * 2, { type: 'sine', dur: dur, gain: gain * 0.2, attack: 0.03, when: at, dest });
        if (soft) this.noise(freq * 2, { dur: 0.08, gain: gain * 0.1, q: 6, when: at, dest });   // the breath
        break;
      }
      default:
        this.tone(freq, { type: 'triangle', dur, gain, when: at, dest });
    }
  }

  drumHit(kind, at, strong) {
    const dest = this.music;
    switch (kind) {
      case 'frame':
        this.noise(190, { dur: strong ? 0.3 : 0.18, gain: strong ? 0.22 : 0.1, q: 1.4, sweepTo: 90, when: at, dest });
        break;
      case 'tabor':
        this.noise(240, { dur: 0.12, gain: strong ? 0.2 : 0.09, q: 2, sweepTo: 120, when: at, dest });
        if (strong) this.tone(90, { type: 'sine', dur: 0.18, gain: 0.16, slideTo: 55, when: at, dest });
        break;
      case 'tabla':
        if (strong) this.tone(150, { type: 'sine', dur: 0.3, gain: 0.18, slideTo: 80, when: at, dest });
        else this.noise(900, { dur: 0.09, gain: 0.1, q: 5, when: at, dest });
        break;
      case 'woodblock':
        this.tone(strong ? 1150 : 900, { type: 'square', dur: 0.05, gain: strong ? 0.1 : 0.05, when: at, dest });
        break;
      case 'log':
        this.tone(strong ? 120 : 160, { type: 'triangle', dur: 0.26, gain: strong ? 0.2 : 0.1, slideTo: strong ? 70 : 110, when: at, dest });
        break;
    }
  }

  /// Keeps the drone going under whichever land you're in, and fades it over when you travel.
  setDrone(land) {
    const c = this.ctx, t = c.currentTime;
    if (this.drone) {
      const old = this.drone;
      old.gain.gain.setTargetAtTime(0, t, 1.2);
      old.oscs.forEach((o) => o.stop(t + 6));
      this.drone = null;
    }
    const L = LANDS[land];
    const g = c.createGain(); g.gain.value = 0.0001; g.connect(this.music);
    g.gain.setTargetAtTime(L.drone, t + 0.4, 1.6);
    const oscs = [];
    for (const [mult, detune, type] of [[0.5, -4, 'sine'], [1, 4, 'sine'], [1.5, 0, 'triangle']]) {
      const o = c.createOscillator(); o.type = type;
      o.frequency.value = L.root * mult; o.detune.value = detune;
      const og = c.createGain(); og.gain.value = mult === 1.5 ? 0.25 : 0.6;
      o.connect(og); og.connect(g); o.start(); oscs.push(o);
    }
    this.drone = { gain: g, oscs };
  }

  /// Called every frame. Keeps a couple of beats of music queued up ahead of time.
  tick() {
    if (!this.ctx || !this.started || !this.musicOn || !this.on) return;
    const c = this.ctx;
    if (this.nextLand && this.nextLand !== this.land) {
      this.land = this.nextLand; this.nextLand = null;
      this.setDrone(this.land);
      this.beat = 0; this.phrase = 0;
      this.nextNoteAt = Math.max(this.nextNoteAt, c.currentTime + 0.1);
    }
    if (!this.land) return;
    const L = LANDS[this.land], step = 60 / L.bpm / 2;      // eighth notes
    const scale = MODES[L.mode];
    while (this.nextNoteAt < c.currentTime + 0.4) {
      const at = this.nextNoteAt, b = this.beat;
      // A phrase of 16, then a bar of quiet to breathe.
      const resting = (this.phrase % 3) === 2 && b >= 8;
      if (!resting && Math.random() < L.density) {
        // Walk up and down the scale rather than jumping about, and land on the root at phrase ends.
        let deg;
        if (b === 0) deg = 0;
        else if (b === 12) deg = 4;
        else {
          const prev = this.lastDeg ?? 0;
          const move = [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)];
          deg = Math.max(-3, Math.min(scale.length + 2, prev + move));
        }
        this.lastDeg = deg;
        const oct = Math.floor(deg / scale.length), note = scale[((deg % scale.length) + scale.length) % scale.length];
        const freq = L.root * semitone(note + oct * 12) * (b === 0 ? 1 : 1);
        const long = b === 0 || b === 12;
        this.voiceNote(freq, long ? step * 3 : step * 1.6, long ? 0.22 : 0.16, at, L.voice);
      }
      if (L.drum && b % L.drumEvery === 0) this.drumHit(L.drum, at, b % (L.drumEvery * 4) === 0);
      this.beat = (b + 1) % 16;
      if (this.beat === 0) this.phrase++;
      this.nextNoteAt += step;
    }
  }
}

import { CANVAS_HEIGHT, CANVAS_WIDTH, PLAYER_COLORS } from '../core/constants.js';
import { clamp, shuffle } from '../core/utils.js';

const ICONS = ['🐙', '🚀', '🌈', '🦊', '🍓', '⚽', '🎵', '⭐', '🧩', '🪁', '🐼', '🎈'];

export class TeamMemoryGame {
  constructor({ players, input, audio, difficulty, onComplete }) {
    this.players = players;
    this.input = input;
    this.audio = audio;
    this.onComplete = onComplete;
    this.startTime = performance.now();
    this.attempts = 0;

    const pairs = 6 + difficulty * 2;
    const deck = shuffle([...ICONS.slice(0, pairs), ...ICONS.slice(0, pairs)]);
    this.cols = 4;
    this.rows = Math.ceil(deck.length / this.cols);

    this.cards = deck.map((value, index) => ({
      value,
      index,
      state: 'hidden',
      flip: 0,
    }));

    this.selection = [];
    this.lockTimer = 0;
    this.cursors = Array.from({ length: players }, (_, i) => ({
      playerId: i,
      index: i,
    }));
  }

  update(dt) {
    this.cards.forEach((card) => {
      const target = card.state === 'hidden' ? 0 : 1;
      card.flip += (target - card.flip) * Math.min(1, dt * 12);
    });

    if (this.lockTimer > 0) {
      this.lockTimer -= dt;
      if (this.lockTimer <= 0) this.resolvePair();
      return;
    }

    this.cursors.forEach((cursor, playerId) => {
      const direction = this.input.consumeDirectionPress(playerId);
      if (direction === 'up') cursor.index -= this.cols;
      if (direction === 'down') cursor.index += this.cols;
      if (direction === 'left') cursor.index -= 1;
      if (direction === 'right') cursor.index += 1;
      cursor.index = clamp(cursor.index, 0, this.cards.length - 1);

      if (this.input.consumeAction(playerId)) {
        this.flipCard(cursor.index);
      }
    });

    if (this.cards.every((card) => card.state === 'matched')) {
      const elapsed = (performance.now() - this.startTime) / 1000;
      const stars = this.attempts <= this.cards.length / 2 + 4 ? 3 : this.attempts <= this.cards.length ? 2 : 1;
      this.audio.beep('win');
      this.onComplete({ stars, summary: `Tentativas: ${this.attempts} · Tempo: ${Math.round(elapsed)}s` });
    }
  }

  flipCard(index) {
    const card = this.cards[index];
    if (!card || card.state !== 'hidden' || this.selection.length >= 2) return;

    card.state = 'revealed';
    this.selection.push(card);
    this.audio.beep('ui');

    if (this.selection.length === 2) {
      this.attempts += 1;
      this.lockTimer = 0.7;
    }
  }

  resolvePair() {
    const [first, second] = this.selection;
    if (!first || !second) return;

    if (first.value === second.value) {
      first.state = 'matched';
      second.state = 'matched';
      this.audio.beep('collect');
    } else {
      first.state = 'hidden';
      second.state = 'hidden';
      this.audio.beep('hit');
    }

    this.selection.length = 0;
  }

  render(ctx) {
    ctx.fillStyle = '#fff5db';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const cardW = 95;
    const cardH = 74;
    const gap = 14;
    const boardW = this.cols * cardW + (this.cols - 1) * gap;
    const boardH = this.rows * cardH + (this.rows - 1) * gap;
    const startX = (CANVAS_WIDTH - boardW) / 2;
    const startY = 70;

    this.cards.forEach((card, idx) => {
      const col = idx % this.cols;
      const row = Math.floor(idx / this.cols);
      const x = startX + col * (cardW + gap);
      const y = startY + row * (cardH + gap);
      const scaleX = Math.max(0.08, Math.abs(card.flip * 2 - 1));

      ctx.save();
      ctx.translate(x + cardW / 2, y + cardH / 2);
      ctx.scale(scaleX, 1);
      ctx.fillStyle = card.state === 'matched' ? '#8ee2ab' : card.flip > 0.5 ? '#ffffff' : '#8fb7ff';
      ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);
      ctx.strokeStyle = '#34507d';
      ctx.lineWidth = 3;
      ctx.strokeRect(-cardW / 2, -cardH / 2, cardW, cardH);
      if (card.flip > 0.5) {
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.value, 0, 3);
      }
      ctx.restore();
    });

    this.cursors.forEach((cursor, idx) => {
      const col = cursor.index % this.cols;
      const row = Math.floor(cursor.index / this.cols);
      const x = startX + col * (cardW + gap);
      const y = startY + row * (cardH + gap);

      ctx.strokeStyle = PLAYER_COLORS[idx];
      ctx.lineWidth = 4;
      ctx.strokeRect(x - 4, y - 4, cardW + 8, cardH + 8);
    });

    const matched = this.cards.filter((card) => card.state === 'matched').length / 2;
    const total = this.cards.length / 2;

    ctx.fillStyle = '#303e5a';
    ctx.font = '22px Trebuchet MS';
    ctx.fillText(`Pares: ${matched}/${total}`, 20, 32);
    ctx.fillText(`Tentativas em equipe: ${this.attempts}`, 190, 32);
    ctx.fillText('Mova o cursor e use ação para revelar', 520, 32);

    if (this.lockTimer > 0) {
      ctx.fillStyle = '#303e5a';
      ctx.font = '18px Trebuchet MS';
      ctx.fillText('Verificando par...', 20, CANVAS_HEIGHT - 18);
    }

    if (startY + boardH > CANVAS_HEIGHT - 10) {
      ctx.fillStyle = '#303e5a';
      ctx.font = '16px Trebuchet MS';
      ctx.fillText('Dica: use resolução maior para mais conforto visual.', 20, CANVAS_HEIGHT - 18);
    }
  }
}

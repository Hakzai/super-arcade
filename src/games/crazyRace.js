import { CANVAS_HEIGHT, CANVAS_WIDTH, PLAYER_COLORS } from '../core/constants.js';
import { clamp, intersects } from '../core/utils.js';

const LEVEL_LENGTH = 1900;

export class CrazyRaceGame {
  constructor({ players, input, audio, difficulty, onComplete }) {
    this.players = players;
    this.input = input;
    this.audio = audio;
    this.difficulty = difficulty;
    this.onComplete = onComplete;
    this.startTime = performance.now();
    this.falls = 0;
    this.cameraX = 0;

    this.platforms = [
      { x: 0, y: 470, w: LEVEL_LENGTH, h: 80 },
      { x: 220, y: 390, w: 120, h: 20 },
      { x: 410, y: 330, w: 130, h: 20 },
      { x: 620, y: 360, w: 120, h: 20 },
      { x: 860, y: 300, w: 140, h: 20 },
      { x: 1090, y: 360, w: 120, h: 20 },
      { x: 1290, y: 320, w: 150, h: 20 },
      { x: 1540, y: 370, w: 140, h: 20 },
    ];

    this.hazards = [
      { x: 530, y: 452, w: 70, h: 18 },
      { x: 1000, y: 452, w: 60, h: 18 },
      { x: 1450, y: 452, w: 80, h: 18 },
    ];

    if (difficulty > 1) {
      this.hazards.push({ x: 760, y: 452, w: 65, h: 18 });
    }

    this.collectibles = [
      { x: 280, y: 350, done: false },
      { x: 470, y: 290, done: false },
      { x: 670, y: 320, done: false },
      { x: 905, y: 260, done: false },
      { x: 1120, y: 320, done: false },
      { x: 1335, y: 280, done: false },
      { x: 1590, y: 330, done: false },
      { x: 1760, y: 430, done: false },
    ].slice(0, 5 + difficulty * 2);

    this.playersState = Array.from({ length: players }, (_, id) => this.spawnPlayer(id));
  }

  spawnPlayer(id) {
    return { id, x: 35 + id * 25, y: 420, w: 24, h: 34, vx: 0, vy: 0, grounded: false, finished: false };
  }

  handleCollisions(player, dt) {
    player.x += player.vx * dt;
    player.x = clamp(player.x, 0, LEVEL_LENGTH - player.w);

    player.y += player.vy * dt;
    player.grounded = false;

    for (const platform of this.platforms) {
      const box = { x: player.x, y: player.y, w: player.w, h: player.h };
      if (intersects(box, platform)) {
        if (player.vy >= 0 && player.y + player.h - player.vy * dt <= platform.y + 3) {
          player.y = platform.y - player.h;
          player.vy = 0;
          player.grounded = true;
        } else if (player.vy < 0 && player.y - player.vy * dt >= platform.y + platform.h - 2) {
          player.y = platform.y + platform.h;
          player.vy = 0;
        }
      }
    }
  }

  resetPlayer(player) {
    const respawn = this.spawnPlayer(player.id);
    Object.assign(player, respawn);
    this.falls += 1;
    this.audio.beep('hit');
  }

  update(dt) {
    for (const player of this.playersState) {
      if (player.finished) continue;
      const axis = this.input.axisForPlayer(player.id);
      player.vx = axis.x * 170;

      if (axis.y < 0 && player.grounded) {
        player.vy = -350;
        player.grounded = false;
      }

      player.vy += 700 * dt;
      this.handleCollisions(player, dt);

      if (player.y > CANVAS_HEIGHT + 60 || this.hazards.some((h) => intersects(player, h))) {
        this.resetPlayer(player);
      }

      this.collectibles.forEach((item) => {
        if (!item.done && intersects(player, { x: item.x - 10, y: item.y - 10, w: 20, h: 20 })) {
          item.done = true;
          this.audio.beep('collect');
        }
      });

      if (player.x > LEVEL_LENGTH - 70) {
        player.finished = true;
      }
    }

    const avgX = this.playersState.reduce((acc, p) => acc + p.x, 0) / this.playersState.length;
    this.cameraX = clamp(avgX - CANVAS_WIDTH / 2, 0, LEVEL_LENGTH - CANVAS_WIDTH);

    const allFinished = this.playersState.every((p) => p.finished);
    const allCollected = this.collectibles.every((c) => c.done);
    if (allFinished && allCollected) {
      const elapsed = (performance.now() - this.startTime) / 1000;
      const stars = elapsed < 160 && this.falls < 5 ? 3 : elapsed < 240 ? 2 : 1;
      this.audio.beep('win');
      this.onComplete({ stars, summary: `Tempo: ${Math.round(elapsed)}s · Quedas: ${this.falls}` });
    }
  }

  render(ctx) {
    ctx.fillStyle = '#92d8ff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    this.platforms.forEach((platform) => {
      ctx.fillStyle = '#5b8f45';
      ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    });

    this.hazards.forEach((hazard) => {
      ctx.fillStyle = '#ee5b5b';
      ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
    });

    this.collectibles.forEach((item) => {
      ctx.fillStyle = item.done ? '#bfd8ff' : '#ffd55f';
      ctx.beginPath();
      ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(LEVEL_LENGTH - 35, 250, 8, 220);
    ctx.fillStyle = '#f5fff0';
    ctx.fillRect(LEVEL_LENGTH - 27, 250, 50, 32);

    this.playersState.forEach((player, index) => {
      ctx.fillStyle = PLAYER_COLORS[index];
      ctx.fillRect(player.x, player.y, player.w, player.h);
    });

    ctx.restore();

    ctx.fillStyle = '#113153';
    ctx.font = '20px Trebuchet MS';
    const collected = this.collectibles.filter((c) => c.done).length;
    const finished = this.playersState.filter((p) => p.finished).length;
    ctx.fillText(`Itens: ${collected}/${this.collectibles.length}`, 20, 30);
    ctx.fillText(`Chegada: ${finished}/${this.playersState.length}`, 220, 30);
  }
}

import { CANVAS_HEIGHT, CANVAS_WIDTH, PLAYER_COLORS } from '../core/constants.js';
import { clamp, intersects, randomInt } from '../core/utils.js';

const TILE = 40;
const MAP_W = 24;
const MAP_H = 13;

export class TreasureHuntGame {
  constructor({ players, input, audio, difficulty, onComplete }) {
    this.players = players;
    this.input = input;
    this.audio = audio;
    this.onComplete = onComplete;
    this.startTime = performance.now();
    this.damage = 0;

    this.walls = this.generateWalls(difficulty);
    this.traps = this.generateTraps(difficulty);

    this.playerStates = Array.from({ length: players }, (_, i) => ({
      id: i,
      x: 70 + i * 35,
      y: 70,
      size: 24,
      speed: 165,
    }));

    this.keys = Array.from({ length: players + difficulty - 1 }, () => this.randomFreeSpot(18));
    this.chest = { ...this.randomFreeSpot(30), w: 32, h: 28 };
    this.finishTimer = 0;
  }

  generateWalls(difficulty) {
    const walls = [];
    walls.push({ x: 0, y: 0, w: MAP_W * TILE, h: TILE });
    walls.push({ x: 0, y: (MAP_H - 1) * TILE, w: MAP_W * TILE, h: TILE });
    walls.push({ x: 0, y: 0, w: TILE, h: MAP_H * TILE });
    walls.push({ x: (MAP_W - 1) * TILE, y: 0, w: TILE, h: MAP_H * TILE });

    const obstacleCount = 8 + difficulty * 3;
    for (let i = 0; i < obstacleCount; i += 1) {
      const horizontal = Math.random() > 0.4;
      const length = randomInt(2, 4) * TILE;
      walls.push({
        x: randomInt(2, MAP_W - 5) * TILE,
        y: randomInt(2, MAP_H - 4) * TILE,
        w: horizontal ? length : TILE,
        h: horizontal ? TILE : length,
      });
    }

    return walls;
  }

  generateTraps(difficulty) {
    return Array.from({ length: 3 + difficulty * 2 }, (_, idx) => ({
      x: randomInt(2, MAP_W - 3) * TILE,
      y: randomInt(2, MAP_H - 3) * TILE,
      w: 28,
      h: 28,
      vx: idx % 2 ? 60 : 0,
      vy: idx % 2 ? 0 : 60,
    }));
  }

  randomFreeSpot(size) {
    let tries = 0;
    while (tries < 1200) {
      const box = {
        x: randomInt(2, MAP_W - 3) * TILE + 5,
        y: randomInt(2, MAP_H - 3) * TILE + 5,
        w: size,
        h: size,
      };
      if (!this.walls.some((wall) => intersects(box, wall))) return box;
      tries += 1;
    }
    return { x: 80, y: 80, w: size, h: size };
  }

  movePlayer(player, dt) {
    const axis = this.input.axisForPlayer(player.id);
    const length = Math.hypot(axis.x, axis.y) || 1;
    const speed = player.speed * dt;
    const prev = { x: player.x, y: player.y };

    player.x += (axis.x / length) * speed;
    const boxX = { x: player.x, y: player.y, w: player.size, h: player.size };
    if (this.walls.some((wall) => intersects(boxX, wall))) {
      player.x = prev.x;
    }

    player.y += (axis.y / length) * speed;
    const boxY = { x: player.x, y: player.y, w: player.size, h: player.size };
    if (this.walls.some((wall) => intersects(boxY, wall))) {
      player.y = prev.y;
    }

    player.x = clamp(player.x, TILE + 2, CANVAS_WIDTH - TILE - player.size - 2);
    player.y = clamp(player.y, TILE + 2, CANVAS_HEIGHT - TILE - player.size - 2);
  }

  update(dt) {
    for (const trap of this.traps) {
      trap.x += trap.vx * dt;
      trap.y += trap.vy * dt;
      if (trap.x < TILE + 5 || trap.x > CANVAS_WIDTH - TILE - trap.w - 5) trap.vx *= -1;
      if (trap.y < TILE + 5 || trap.y > CANVAS_HEIGHT - TILE - trap.h - 5) trap.vy *= -1;
    }

    this.playerStates.forEach((player) => this.movePlayer(player, dt));

    this.playerStates.forEach((player) => {
      const pBox = { x: player.x, y: player.y, w: player.size, h: player.size };
      for (let i = this.keys.length - 1; i >= 0; i -= 1) {
        if (intersects(pBox, this.keys[i])) {
          this.keys.splice(i, 1);
          this.audio.beep('collect');
        }
      }

      if (this.traps.some((trap) => intersects(pBox, trap))) {
        this.damage += 1;
        player.x = 70 + player.id * 35;
        player.y = 70;
        this.audio.beep('hit');
      }
    });

    if (this.keys.length === 0) {
      const playersNearChest = this.playerStates.every((player) =>
        intersects({ x: player.x, y: player.y, w: player.size, h: player.size }, this.chest),
      );
      this.finishTimer = playersNearChest ? this.finishTimer + dt : 0;
      if (this.finishTimer > 1.2) {
        const elapsed = (performance.now() - this.startTime) / 1000;
        const stars = elapsed < 150 && this.damage < 4 ? 3 : elapsed < 220 ? 2 : 1;
        this.audio.beep('win');
        this.onComplete({ stars, summary: `Tempo: ${Math.round(elapsed)}s · Armadilhas: ${this.damage}` });
      }
    }
  }

  render(ctx) {
    ctx.fillStyle = '#182335';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#233f5a';
    ctx.fillRect(TILE, TILE, CANVAS_WIDTH - TILE * 2, CANVAS_HEIGHT - TILE * 2);

    this.walls.forEach((wall) => {
      ctx.fillStyle = '#5d7993';
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    });

    this.traps.forEach((trap) => {
      ctx.fillStyle = '#ff7a7a';
      ctx.fillRect(trap.x, trap.y, trap.w, trap.h);
    });

    this.keys.forEach((key) => {
      ctx.fillStyle = '#ffe36e';
      ctx.fillRect(key.x, key.y, key.w, key.h);
    });

    ctx.fillStyle = this.keys.length === 0 ? '#7bf18c' : '#a26d30';
    ctx.fillRect(this.chest.x, this.chest.y, this.chest.w, this.chest.h);

    this.playerStates.forEach((player, index) => {
      ctx.fillStyle = PLAYER_COLORS[index];
      ctx.fillRect(player.x, player.y, player.size, player.size);
    });

    ctx.fillStyle = '#fff';
    ctx.font = '20px Trebuchet MS';
    ctx.fillText(`Chaves restantes: ${this.keys.length}`, 18, 28);
    ctx.fillText('Juntem toda equipe no baú para concluir!', 280, 28);
  }
}

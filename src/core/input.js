import { PLAYER_CONTROLS } from './constants.js';

export class InputManager {
  constructor() {
    this.down = new Set();
    this.justPressed = new Set();

    window.addEventListener('keydown', (event) => {
      if (PLAYER_CONTROLS.some((p) => Object.values(p.keys).includes(event.code))) {
        event.preventDefault();
      }
      if (!this.down.has(event.code)) {
        this.justPressed.add(event.code);
      }
      this.down.add(event.code);
    });

    window.addEventListener('keyup', (event) => {
      this.down.delete(event.code);
      this.justPressed.delete(event.code);
    });

    window.addEventListener('blur', () => {
      this.down.clear();
      this.justPressed.clear();
    });
  }

  axisForPlayer(playerIndex) {
    const keys = PLAYER_CONTROLS[playerIndex].keys;
    const x = (this.down.has(keys.right) ? 1 : 0) - (this.down.has(keys.left) ? 1 : 0);
    const y = (this.down.has(keys.down) ? 1 : 0) - (this.down.has(keys.up) ? 1 : 0);
    return { x, y };
  }

  consumeAction(playerIndex) {
    const code = PLAYER_CONTROLS[playerIndex].keys.action;
    if (this.justPressed.has(code)) {
      this.justPressed.delete(code);
      return true;
    }
    return false;
  }

  consumeDirectionPress(playerIndex) {
    const keys = PLAYER_CONTROLS[playerIndex].keys;
    for (const direction of ['up', 'down', 'left', 'right']) {
      const code = keys[direction];
      if (this.justPressed.has(code)) {
        this.justPressed.delete(code);
        return direction;
      }
    }
    return null;
  }

  isDown(code) {
    return this.down.has(code);
  }
}

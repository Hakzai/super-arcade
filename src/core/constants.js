export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

export const PLAYER_CONTROLS = [
  { id: 1, label: 'Jogador 1', move: 'WASD', action: 'E', keys: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', action: 'KeyE' } },
  { id: 2, label: 'Jogador 2', move: 'Setas', action: 'Enter', keys: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', action: 'Enter' } },
  { id: 3, label: 'Jogador 3', move: 'IJKL', action: 'O', keys: { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL', action: 'KeyO' } },
  { id: 4, label: 'Jogador 4', move: 'TFGH', action: 'Y', keys: { up: 'KeyT', down: 'KeyG', left: 'KeyF', right: 'KeyH', action: 'KeyY' } },
];

export const PLAYER_COLORS = ['#f65f5f', '#4da4ff', '#6fcf55', '#a977ff'];

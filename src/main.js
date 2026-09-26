import { AudioManager } from './core/audio.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH, PLAYER_CONTROLS } from './core/constants.js';
import { InputManager } from './core/input.js';
import { SessionState } from './core/state.js';
import { CrazyRaceGame } from './games/crazyRace.js';
import { TeamMemoryGame } from './games/teamMemory.js';
import { TreasureHuntGame } from './games/treasureHunt.js';

const GAME_META = {
  treasure: {
    title: 'Caça ao Tesouro',
    objective: 'Coletem todas as chaves e juntem todos no baú para abrir.',
    description: 'Explorem a masmorra, desviem de armadilhas e trabalhem juntos.',
    create: (args) => new TreasureHuntGame(args),
  },
  race: {
    title: 'Corrida Maluca',
    objective: 'Coletem todos os itens e levem todos os personagens até a bandeira.',
    description: 'Corram, pulem obstáculos e retornem após quedas.',
    create: (args) => new CrazyRaceGame(args),
  },
  memory: {
    title: 'Memória em Equipe',
    objective: 'Encontrem todos os pares de cartas cooperando nas tentativas.',
    description: 'Cada jogador move seu cursor e o grupo compartilha as jogadas.',
    create: (args) => new TeamMemoryGame(args),
  },
};

class SuperArcadeApp {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ui = document.getElementById('app-ui');

    this.state = new SessionState();
    this.input = new InputManager();
    this.audio = new AudioManager();

    this.currentMode = 'home';
    this.activeGame = null;
    this.currentGameId = null;
    this.lastResult = null;
    this.lastFrame = performance.now();

    this.showHome();
    requestAnimationFrame((time) => this.loop(time));
  }

  setUI(markup) {
    this.ui.innerHTML = markup;
  }

  controlListMarkup() {
    return PLAYER_CONTROLS.slice(0, this.state.playerCount)
      .map((control) => `<li><strong>${control.label}:</strong> mover ${control.move} | ação ${control.action}</li>`)
      .join('');
  }

  showHome() {
    this.currentMode = 'home';
    this.drawBackground('menu');
    this.setUI(`
      <h2>Bem-vindos ao Super Arcade!</h2>
      <p>Escolham quantos aventureiros vão jogar juntos.</p>
      <div class="ui-row">
        <label for="player-count">Quantidade de jogadores:</label>
        <select id="player-count">
          <option value="2" ${this.state.playerCount === 2 ? 'selected' : ''}>2</option>
          <option value="3" ${this.state.playerCount === 3 ? 'selected' : ''}>3</option>
          <option value="4" ${this.state.playerCount === 4 ? 'selected' : ''}>4</option>
        </select>
      </div>
      <div class="grid-info">
        <article class="card"><h3>Objetivo</h3><p>Concluir os 3 minijogos e ganhar estrelas em equipe.</p></article>
        <article class="card"><h3>Estrelas atuais</h3><p>${this.state.totalStars} ⭐</p></article>
        <article class="card"><h3>Áudio</h3><p>${this.audio.muted ? 'Silenciado' : 'Ativo'}</p></article>
      </div>
      <ul>${this.controlListMarkup()}</ul>
      <div class="ui-row">
        <button id="start-btn">Abrir menu de minijogos</button>
        <button class="secondary" id="mute-btn">${this.audio.muted ? 'Ativar som' : 'Silenciar'}</button>
      </div>
    `);

    this.ui.querySelector('#player-count').addEventListener('change', (event) => {
      this.state.setPlayerCount(event.target.value);
      this.showHome();
    });

    this.ui.querySelector('#start-btn').addEventListener('click', () => {
      this.audio.beep('ui');
      this.showGameMenu();
    });

    this.ui.querySelector('#mute-btn').addEventListener('click', () => {
      this.audio.toggleMute();
      this.showHome();
    });
  }

  showGameMenu() {
    this.currentMode = 'menu';
    this.drawBackground('menu');
    this.setUI(`
      <h2>Menu Central</h2>
      <p>Escolham um desafio cooperativo e acumulem estrelas para o time.</p>
      <div class="grid-info">
        <article class="card"><h3>Estrelas da equipe</h3><p>${this.state.totalStars} ⭐</p></article>
        <article class="card"><h3>Jogadores</h3><p>${this.state.playerCount} participantes</p></article>
        <article class="card"><h3>Dificuldade</h3><p>Progressiva a cada conclusão</p></article>
      </div>
      <div class="ui-row">
        <button data-game="treasure">Caça ao Tesouro</button>
        <button data-game="race">Corrida Maluca</button>
        <button data-game="memory">Memória em Equipe</button>
      </div>
      <div class="ui-row">
        <button class="secondary" id="back-home">Voltar ao início</button>
      </div>
    `);

    this.ui.querySelectorAll('[data-game]').forEach((button) => {
      button.addEventListener('click', () => {
        this.audio.beep('ui');
        this.showInstructions(button.dataset.game);
      });
    });

    this.ui.querySelector('#back-home').addEventListener('click', () => this.showHome());
  }

  showInstructions(gameId) {
    this.currentGameId = gameId;
    const info = GAME_META[gameId];
    this.currentMode = 'instructions';
    this.drawBackground('instructions');
    this.setUI(`
      <h2>${info.title}</h2>
      <p><strong>Objetivo:</strong> ${info.objective}</p>
      <p>${info.description}</p>
      <p><strong>Dificuldade atual:</strong> ${this.state.difficulty(gameId)} / 3</p>
      <h3>Controles ativos</h3>
      <ul>${this.controlListMarkup()}</ul>
      <div class="ui-row">
        <button id="play-game">Iniciar desafio</button>
        <button class="secondary" id="back-menu">Voltar ao menu</button>
      </div>
    `);

    this.ui.querySelector('#play-game').addEventListener('click', () => this.startGame(gameId));
    this.ui.querySelector('#back-menu').addEventListener('click', () => this.showGameMenu());
  }

  startGame(gameId) {
    const info = GAME_META[gameId];
    this.currentMode = 'playing';
    this.lastResult = null;
    this.setUI(`
      <h2>${info.title}</h2>
      <p>Desafio em andamento. Cooperação total para concluir!</p>
      <div class="ui-row">
        <button class="secondary" id="exit-game">Sair para o menu</button>
      </div>
    `);

    this.ui.querySelector('#exit-game').addEventListener('click', () => {
      this.activeGame = null;
      this.showGameMenu();
    });

    const difficulty = this.state.difficulty(gameId);
    this.activeGame = info.create({
      players: this.state.playerCount,
      input: this.input,
      audio: this.audio,
      difficulty,
      onComplete: (result) => this.finishGame(gameId, result),
    });
  }

  finishGame(gameId, result) {
    if (this.currentMode !== 'playing') return;
    this.activeGame = null;
    this.lastResult = result;
    this.state.award(gameId, result.stars);
    this.currentMode = 'result';
    this.drawBackground('menu');

    const completedGames = Object.entries(this.state.games)
      .map(([id, value]) => `<li>${GAME_META[id].title}: ${value.completed} conclusão(ões), ${value.stars} ⭐</li>`)
      .join('');

    this.setUI(`
      <h2>Desafio concluído!</h2>
      <p>Vocês ganharam <strong>${result.stars} ⭐</strong>.</p>
      <p>${result.summary}</p>
      <p><strong>Total da sessão:</strong> ${this.state.totalStars} ⭐</p>
      <h3>Resumo por minijogo</h3>
      <ul>${completedGames}</ul>
      <div class="ui-row">
        <button id="repeat-game">Repetir minijogo</button>
        <button id="menu-game" class="secondary">Voltar ao menu</button>
      </div>
    `);

    this.ui.querySelector('#repeat-game').addEventListener('click', () => this.showInstructions(gameId));
    this.ui.querySelector('#menu-game').addEventListener('click', () => this.showGameMenu());
  }

  drawBackground(type) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (type === 'menu') {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#77d2ff');
      grad.addColorStop(1, '#d5f0ff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffffcc';
      ctx.fillRect(70, 70, CANVAS_WIDTH - 140, CANVAS_HEIGHT - 140);
      ctx.fillStyle = '#214b78';
      ctx.font = 'bold 46px Trebuchet MS';
      ctx.textAlign = 'center';
      ctx.fillText('Super Arcade', CANVAS_WIDTH / 2, 160);
      ctx.font = '24px Trebuchet MS';
      ctx.fillText('Aventura em Equipe', CANVAS_WIDTH / 2, 200);
      ctx.textAlign = 'start';
    } else {
      ctx.fillStyle = '#f1f8ff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#3f5f7d';
      ctx.font = '28px Trebuchet MS';
      ctx.fillText('Preparem os controles e cooperem!', 220, 120);
    }
  }

  loop(time) {
    const dt = Math.min(0.033, (time - this.lastFrame) / 1000);
    this.lastFrame = time;

    if (this.currentMode === 'playing' && this.activeGame) {
      this.activeGame.update(dt);
      this.activeGame.render(this.ctx);
    }

    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }
}

new SuperArcadeApp();

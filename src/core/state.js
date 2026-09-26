const GAME_IDS = ['treasure', 'race', 'memory'];

export class SessionState {
  constructor() {
    this.playerCount = 2;
    this.totalStars = 0;
    this.games = Object.fromEntries(GAME_IDS.map((id) => [id, { completed: 0, stars: 0 }]));
  }

  setPlayerCount(count) {
    this.playerCount = Math.min(4, Math.max(2, Number(count) || 2));
  }

  award(gameId, stars) {
    const game = this.games[gameId];
    if (!game) return;
    game.completed += 1;
    game.stars += stars;
    this.totalStars += stars;
  }

  difficulty(gameId) {
    const completed = this.games[gameId]?.completed ?? 0;
    return Math.min(3, 1 + completed);
  }
}

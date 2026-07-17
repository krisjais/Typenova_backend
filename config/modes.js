const GAME_MODES = {
  official: {
    category: 'COMPETITIVE',
    leaderboard: true,
    xp: 100,
    personalBest: true,
    achievements: true,
    multiplier: { weekend: 2.0, daily: 1.0 }
  },
  daily: {
    category: 'COMPETITIVE',
    leaderboard: true,
    xp: 150,
    personalBest: true,
    achievements: true,
    multiplier: { weekend: 2.0, daily: 1.0 }
  },
  weekly: {
    category: 'COMPETITIVE',
    leaderboard: true,
    xp: 200,
    personalBest: true,
    achievements: true,
    multiplier: { weekend: 2.0, daily: 1.0 }
  },
  practice: {
    category: 'PRACTICE',
    leaderboard: false,
    xp: 10,
    personalBest: false,
    achievements: false
  },
  custom: {
    category: 'PRACTICE',
    leaderboard: false,
    xp: 0,
    personalBest: false,
    achievements: false
  },
  novaRacer: {
    category: 'COMPETITIVE',
    leaderboard: true,
    xp: 120,
    personalBest: true,
    achievements: true,
    multiplier: { weekend: 1.5, daily: 1.0 }
  },
  zombieEscape: {
    category: 'COMPETITIVE',
    leaderboard: true,
    xp: 120,
    personalBest: true,
    achievements: true,
    multiplier: { weekend: 1.5, daily: 1.0 }
  },
  typeRacer: {
    category: 'COMPETITIVE',
    leaderboard: true,
    xp: 120,
    personalBest: true,
    achievements: true,
    multiplier: { weekend: 1.5, daily: 1.0 }
  },
  rocketRush: {
    category: 'COMPETITIVE',
    leaderboard: true,
    xp: 150,
    personalBest: true,
    achievements: true,
    multiplier: { weekend: 2.0, daily: 1.0 }
  }
};

// Mappings for different naming styles
GAME_MODES['nova-racer'] = GAME_MODES.novaRacer;
GAME_MODES['zombie-escape'] = GAME_MODES.zombieEscape;
GAME_MODES['type-racer'] = GAME_MODES.typeRacer;
GAME_MODES['rocket-rush'] = GAME_MODES.rocketRush;

GAME_MODES.CURRENT_SEASON = 1;

module.exports = GAME_MODES;

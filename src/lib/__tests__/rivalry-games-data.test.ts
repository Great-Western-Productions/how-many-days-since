import { describe, expect, it } from 'vitest';
import games from '../../data/rivalry-games.json';

describe('rivalry-games.json', () => {
  // Guards the result PRs prepared before the 2026 game: their placeholder
  // 0-0 score fails here until the final score is entered.
  it('has the winner ahead in every decided game', () => {
    for (const game of games.filter((entry) => entry.winner !== 'Tie')) {
      expect(game.wScore, `${game.year}`).toBeGreaterThan(game.lScore);
    }
  });
});

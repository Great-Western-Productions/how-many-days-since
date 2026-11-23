import { describe, expect, it } from 'vitest';
import { nextRivalryGame } from '../next-rivalry-game';

describe('nextRivalryGame', () => {
  it('points at the 2027 meeting in Ann Arbor, on the expected Saturday', () => {
    expect(nextRivalryGame).toMatchObject({
      name: 'Ohio State vs. Michigan',
      date: 'November 27, 2027',
      location: 'Ann Arbor',
      timeZone: 'America/New_York',
      start: '2027-11-27T12:00:00-05:00',
      time: 'Time TBA',
      dateAnnounced: false,
    });
    expect(nextRivalryGame.venue.name).toBe('Michigan Stadium');
    expect(nextRivalryGame.homeTeam.name).toBe('Michigan Wolverines');
  });
});

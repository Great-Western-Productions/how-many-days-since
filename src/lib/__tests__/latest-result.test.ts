import { describe, expect, it } from 'vitest';
import games from '../../data/rivalry-games.json';
import { RESULT_FRESH_DAYS, freshResult, gameResult, resultFor, resultIsFresh, seriesRecord, shareGraphicPanel } from '../latest-result';

const OSU_2026 = { id: 122, year: 2026, date: 'Nov 28', winner: 'Ohio State', loser: 'Michigan', wScore: 45, lScore: 0, location: 'Columbus', wRank: 25, lRank: null };
const MICH_2024 = { id: 120, year: 2024, date: 'Nov 30', winner: 'Michigan', loser: 'Ohio State', wScore: 13, lScore: 10, location: 'Columbus', wRank: null, lRank: 2 };
const TIE_1992 = { id: 88, year: 1992, date: 'Nov 21', winner: 'Tie', loser: 'Tie', wScore: 13, lScore: 13, location: 'Columbus', wRank: null, lRank: null };
const ROWS = [OSU_2026, MICH_2024, TIE_1992] as unknown as typeof games;

describe('gameResult', () => {
  it('announces the winner, the score and where the game was played', () => {
    expect(gameResult(OSU_2026 as (typeof games)[number])).toMatchObject({
      year: 2026,
      score: '45-0',
      longDate: 'November 28, 2026',
      location: 'Columbus',
      headline: 'OHIO STATE WINS THE GAME, 45-0',
      team: 'osu',
    });
  });

  it('wears the winner\'s color for a Michigan win and none for a tie', () => {
    expect(gameResult(MICH_2024 as (typeof games)[number])).toMatchObject({ headline: 'MICHIGAN WINS THE GAME, 13-10', team: 'mich' });
    expect(gameResult(TIE_1992 as (typeof games)[number])).toMatchObject({ headline: 'THE GAME ENDS IN A TIE, 13-13', team: undefined });
  });
});

describe('freshResult', () => {
  const at = (iso: string) => freshResult(new Date(iso), ROWS);

  it('leads with the latest game from kickoff through the last fresh day', () => {
    expect(at('2026-11-28T16:00:00-05:00')?.headline).toBe('OHIO STATE WINS THE GAME, 45-0');
    expect(at('2026-12-05T23:59:00-05:00')?.year).toBe(2026);
    expect(RESULT_FRESH_DAYS).toBe(7);
  });

  it('steps aside the day after the window and before the game is played', () => {
    expect(at('2026-12-06T00:00:00-05:00')).toBeNull();
    expect(at('2026-11-28T09:00:00-05:00')).toBeNull();
  });
});

describe('resultIsFresh', () => {
  const kickoff = new Date(gameResult(OSU_2026 as (typeof games)[number]).kickoffIso);

  it('answers for a page that was built during the window and opened after it', () => {
    expect(kickoff.toISOString()).toBe('2026-11-28T17:00:00.000Z');
    expect(resultIsFresh(kickoff, new Date('2026-12-05T12:00:00-05:00'))).toBe(true);
    expect(resultIsFresh(kickoff, new Date('2026-12-06T08:00:00-05:00'))).toBe(false);
    expect(resultIsFresh(kickoff, new Date('2026-11-28T09:00:00-05:00'))).toBe(false);
  });
});

describe('resultFor', () => {
  it('finds a season\'s game and reports none for a season not yet played', () => {
    expect(resultFor(2024, ROWS)?.headline).toBe('MICHIGAN WINS THE GAME, 13-10');
    expect(resultFor(2027, ROWS)).toBeNull();
  });
});

describe('seriesRecord', () => {
  it('counts every game in the record once', () => {
    const series = seriesRecord();
    expect(series.michigan + series.ohioState + series.ties).toBe(games.length);
    expect(seriesRecord(ROWS)).toEqual({ michigan: 1, ohioState: 1, ties: 1 });
  });
});

describe('shareGraphicPanel', () => {
  it('prints the latest score and the series with en dashes', () => {
    expect(shareGraphicPanel(ROWS)).toEqual({ latest: 'OHIO STATE 45–0', latestTeam: 'osu', series: '1–1–1' });
  });

  it('follows the live record', () => {
    const [latest] = games;
    const series = seriesRecord();
    expect(shareGraphicPanel()).toMatchObject({
      latest: `${latest.winner.toUpperCase()} ${latest.wScore}–${latest.lScore}`,
      series: `${series.michigan}–${series.ohioState}–${series.ties}`,
    });
  });
});

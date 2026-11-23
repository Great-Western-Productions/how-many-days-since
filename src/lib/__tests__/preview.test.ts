import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import games from '../../data/rivalry-games.json';
import {
  cityFor,
  edgesHeld,
  formatBandValue,
  formatEdge,
  formatRecord,
  historyText,
  kickoffDate,
  kickoffTime,
  kickoffWeekday,
  marginText,
  matchups,
  monthDay,
  previewDescription,
  previewTitle,
  rankText,
  resultText,
  rivalryPreview,
  tapeRecord,
  twinSummary,
  type Band,
  type PastTape,
  type RivalryPreview,
  type Twin,
} from '../preview';

const band = (overrides: Partial<Band> = {}): Band => ({
  id: 'rushing',
  label: 'Rushing',
  unit: 'yards per carry',
  sides: {
    'ohio-state': { offense: 4.0437, defense: 3.2157, net: 0.828 },
    michigan: { offense: 3.6683, defense: 2.9713, net: 0.697 },
  },
  edge: { teamId: 'ohio-state', margin: 0.1309 },
  history: [{ since: 2004, won: 14, of: 21 }],
  missedSeasons: [2024],
  ...overrides,
});

const twin = (season: number, winner: Twin['winner']): Twin => ({
  season,
  distance: 1,
  homeTeamId: 'ohio-state',
  winner,
  score: { 'ohio-state': 21, michigan: 6 },
  records: { 'ohio-state': { wins: 8, losses: 2, ties: 0 }, michigan: { wins: 6, losses: 4, ties: 0 } },
});

const pastTape = (season: number, winner: PastTape['winner'], ohioState: number, michigan: number): PastTape => ({
  season,
  winner,
  edges: { 'ohio-state': ohioState, michigan },
});

describe('band formatting', () => {
  it('prints a value with the verb for its side of the ball', () => {
    expect(formatBandValue('rushing', 'offense', 4.0437)).toBe('4.04 gained');
    expect(formatBandValue('scoring', 'defense', 19.5455)).toBe('19.5 allowed');
    expect(formatBandValue('turnovers', 'defense', 1.0909)).toBe('1.09 taken away');
  });

  it('prints a rate as a percentage', () => {
    expect(formatBandValue('third-down', 'offense', 0.4532)).toBe('45.3% converted');
    expect(formatBandValue('red-zone', 'defense', 0.9063)).toBe('90.6% allowed');
  });

  it('says so when a side has no number', () => {
    expect(formatBandValue('red-zone', 'offense', null)).toBe('No data');
  });

  it('names the team holding the edge and the size of it', () => {
    expect(formatEdge(band())).toBe('Ohio State +0.13 yards per carry');
    expect(formatEdge(band({ id: 'third-down', edge: { teamId: 'michigan', margin: 0.0171 } }))).toBe('Michigan +1.7 percentage points');
    expect(formatEdge(band({ edge: null }))).toBe('Even');
  });

  it('pairs each offense with the defense it faces, Ohio State on the left', () => {
    expect(matchups(band())).toEqual([
      { label: 'Ohio State offense vs Michigan defense', ohioState: '4.04 gained', michigan: '2.97 allowed' },
      { label: 'Michigan offense vs Ohio State defense', ohioState: '3.22 allowed', michigan: '3.67 gained' },
    ]);
  });

  it('reports history as a count', () => {
    expect(historyText({ since: 2004, won: 17, of: 21 })).toBe('17 of 21 since 2004');
  });
});

describe('summaries', () => {
  it('counts the edges each team holds', () => {
    const tape = [band(), band({ edge: { teamId: 'michigan', margin: 1 } }), band({ edge: null })];

    expect(edgesHeld(tape)).toEqual({ 'ohio-state': 1, michigan: 1 });
  });

  it('scores the team with more edges and finds the widest miss', () => {
    const record = tapeRecord([
      pastTape(2018, 'ohio-state', 1, 6),
      pastTape(2019, 'ohio-state', 7, 0),
      pastTape(2024, 'michigan', 7, 0),
    ]);

    expect(record).toMatchObject({ won: 1, of: 3 });
    expect(record.upset).toMatchObject({ season: 2024, winner: 'michigan' });
  });

  it('describes how the closest meetings ended', () => {
    expect(twinSummary([twin(1984, 'ohio-state'), twin(2012, 'ohio-state'), twin(1998, 'ohio-state')])).toBe('Ohio State won all 3.');
    expect(twinSummary([twin(1984, 'michigan'), twin(2012, 'ohio-state'), twin(1998, 'michigan')])).toBe('Michigan won 2 of the 3.');
    expect(twinSummary([twin(1973, 'tie')])).toBe('The closest meetings split evenly.');
    expect(twinSummary([])).toBe('');
  });

  it('formats records, ranks, results, margins and dates', () => {
    expect(formatRecord({ wins: 7, losses: 4, ties: 0 })).toBe('7-4');
    expect(formatRecord({ wins: 9, losses: 0, ties: 1 })).toBe('9-0-1');
    expect(rankText(25)).toBe('AP No. 25');
    expect(rankText(null)).toBe('Unranked');
    expect(resultText({ site: 'away', date: '2026-10-03', pointsFor: 31, pointsAgainst: 14 })).toBe('W 31-14');
    expect(resultText({ site: 'home', date: '2026-09-26', pointsFor: 19, pointsAgainst: 20 })).toBe('L 19-20');
    expect(marginText(2.7)).toBe('+2.7');
    expect(marginText(-10.7)).toBe('-10.7');
    expect(monthDay('2026-11-21')).toBe('November 21');
    expect(cityFor('michigan')).toBe('Ann Arbor');
  });
});

describe('kickoff', () => {
  const at = (date: string, homeTeamId: 'ohio-state' | 'michigan' = 'ohio-state') =>
    ({ ...rivalryPreview, game: { season: 2026, date, homeTeamId } }) as RivalryPreview;

  it('reads the date and time on the Eastern clock', () => {
    const noon = at('2026-11-28T17:00:00.000Z');

    expect(kickoffDate(noon)).toBe('November 28, 2026');
    expect(kickoffWeekday(noon)).toBe('Saturday');
    expect(kickoffTime(noon)).toBe('Noon ET');
    expect(kickoffTime(at('2026-11-28T20:30:00.000Z'))).toBe('3:30 PM ET');
  });

  it('keeps a late kickoff on its own calendar day', () => {
    // 8 PM Eastern is already the next day in UTC.
    expect(kickoffDate(at('2026-11-29T01:00:00.000Z'))).toBe('November 28, 2026');
  });

  it('names the host first in the description', () => {
    expect(previewDescription(at('2027-11-27T17:00:00.000Z', 'michigan'))).toMatch(/^Michigan \(\d+-\d+\) hosts Ohio State \(\d+-\d+\) on Saturday, November 27, 2027\. /);
  });
});

describe('the synced preview', () => {
  it('reads the supported schema', () => {
    expect(rivalryPreview.schemaVersion).toBe('rivalry-preview-v1');
  });

  it('carries each band once with a usable history', () => {
    expect(rivalryPreview.tape.map((entry) => entry.id).sort()).toEqual(
      ['first-downs', 'passing', 'red-zone', 'rushing', 'scoring', 'third-down', 'turnovers']
    );
    for (const entry of rivalryPreview.tape) {
      expect(entry.history[0].of, entry.id).toBeGreaterThan(0);
      expect(entry.history[0].won, entry.id).toBeLessThanOrEqual(entry.history[0].of);
    }
  });

  it('lists past meetings that have a record page to link to', () => {
    const seasons = new Set(games.map((game) => game.year));

    expect(rivalryPreview.twins.length).toBeGreaterThan(0);
    for (const entry of rivalryPreview.twins) expect(seasons.has(entry.season), String(entry.season)).toBe(true);
  });

  it('titles and describes the page from its own game record', () => {
    expect(previewTitle(rivalryPreview)).toBe(`Ohio State vs Michigan ${rivalryPreview.game.season} Preview: Tale of the Tape`);
    expect(previewTitle(rivalryPreview).length).toBeLessThanOrEqual(60);
    expect(previewDescription(rivalryPreview)).toMatch(
      /^(Ohio State|Michigan) \(\d+-\d+(-\d+)?\) hosts (Ohio State|Michigan) \(\d+-\d+(-\d+)?\) on Saturday, November \d+, \d{4}\. /
    );
  });

  it('holds no private warehouse keys', () => {
    const raw = readFileSync(new URL('../../data/rivalry-preview.json', import.meta.url), 'utf8');

    for (const privateKey of ['payload_json', 'source_identifier', 'sourceIdentifier', 'sourceGameId', 'sourceRecordId', 'teamGameStats', 'game_drives']) {
      expect(raw).not.toContain(privateKey);
    }
  });
});

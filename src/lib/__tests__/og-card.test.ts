import { describe, expect, it } from 'vitest';
import games from '../../data/rivalry-games.json';
import {
  DEFAULT_OG_IMAGE_PATH,
  headlineText,
  ogCardAlt,
  ogImagePathFor,
  pagePathForOgRoute,
  resolveOgCard,
} from '../og-card';

const NOW = new Date('2026-08-17T16:00:00Z');
/** Three days after the 2026 meeting, which the record now holds. */
const AFTER_2026 = new Date('2026-12-01T16:00:00Z');
const game2026 = games[0];
const score2026 = `${game2026.wScore}-${game2026.lScore}`;

describe('resolveOgCard', () => {
  it('counts the days since the last Michigan win on the home card', () => {
    const card = resolveOgCard('/', NOW);

    expect(card?.metric).toEqual({ value: '625', unit: 'DAYS' });
    expect(card?.detail).toContain(`Ohio State ${game2026.wScore}, Michigan ${game2026.lScore}`);
    // The streak is Ohio State's, so the card wears scarlet.
    expect(card?.team).toBe('ohio-state');
  });

  it('counts down to kickoff on the countdown card', () => {
    const card = resolveOgCard('/countdown', NOW);

    // Aug 17 2026 → the expected Nov 27 2027.
    expect(card?.metric).toEqual({ value: '467', unit: 'DAYS' });
    expect(card?.detail).toContain('November 27, 2027 (expected)');
    expect(card?.team).toBe('rivalry');
  });

  it('follows the countdown page through game day', () => {
    const at = (iso: string) => resolveOgCard('/countdown', new Date(iso));

    expect(at('2027-11-27T08:00:00-05:00')?.headline).toBe('GAME DAY');
    expect(at('2027-11-27T08:00:00-05:00')?.metric).toBeUndefined();
    expect(at('2027-11-27T13:00:00-05:00')?.headline).toBe('IN PROGRESS');
    // The 2027 kickoff time is not set, so the card names the stadium alone.
    expect(at('2027-11-27T13:00:00-05:00')?.detail).toBe('Michigan Stadium');
    expect(at('2027-11-27T17:00:00-05:00')?.headline).toBe('FINAL');
  });

  it('carries both records and the kickoff on the preview card', () => {
    const card = resolveOgCard('/preview', NOW);

    expect(card?.headline).toBe('THE PREVIEW');
    expect(card?.detail).toMatch(/^Ohio State \d+-\d+ · Michigan \d+-\d+ · November \d+, \d{4} · (Columbus|Ann Arbor)$/);
    expect(card?.team).toBe('rivalry');
  });

  it('counts the days since the last Ohio State win on its own card', () => {
    const card = resolveOgCard('/days-since-ohio-state-beat-michigan', AFTER_2026);

    expect(card?.eyebrow).toBe('HOW MANY DAYS SINCE OHIO STATE BEAT MICHIGAN?');
    // Nov 28 2026 → Dec 1 2026, Eastern calendar days.
    expect(card?.metric).toEqual({ value: '3', unit: 'DAYS' });
    expect(card?.detail).toBe(`Last Ohio State win: ${score2026} in Columbus · November 28, 2026`);
    expect(card?.team).toBe('ohio-state');
  });

  it('reports the meeting count on the record card', () => {
    const card = resolveOgCard('/record', NOW);

    expect(card?.headline).toBe('THE RECORD');
    expect(card?.eyebrow).toBe('EVERY MEETING · 1897-2026');
    expect(card?.detail).toContain('All 122 Ohio State-Michigan meetings');
  });

  it('colors each team in a rivalry meeting score', () => {
    const card = resolveOgCard('/record/2024', NOW);

    expect(card?.headline).toEqual([
      { text: 'MICHIGAN', tone: 'michigan' },
      { text: '13–10' },
      { text: 'OHIO STATE', tone: 'ohio-state' },
    ]);
    expect(card?.detail).toBe('Nov 30 · Columbus');
    // The winner's colors dress the card.
    expect(card?.team).toBe('michigan');
  });

  it('keeps both sides of a tied meeting in ink', () => {
    const card = resolveOgCard('/record/1992', NOW);

    // Both sides carry "Tie", and neither may be read as a team.
    expect(card?.headline).toEqual([
      { text: 'TIE', tone: 'ink' },
      { text: '13–13' },
      { text: 'TIE', tone: 'ink' },
    ]);
    expect(card?.team).toBe('rivalry');
  });

  it('keeps every tied meeting neutral', () => {
    for (const year of [1900, 1910, 1941, 1949, 1973, 1992]) {
      const card = resolveOgCard(`/record/${year}`, NOW);
      const tones = (card!.headline as { tone?: string }[]).map((span) => span.tone);

      expect(tones, `${year}`).not.toContain('michigan');
      expect(tones, `${year}`).not.toContain('ohio-state');
      expect(card?.team, `${year}`).toBe('rivalry');
    }
  });

  it('summarises a team season without leaking the raw margin float', () => {
    const card = resolveOgCard('/teams/michigan/1997', NOW);

    expect(headlineText(card!.headline!)).toBe('MICHIGAN 12-0');
    expect(card?.detail).toBe('12 games · 322 for · 114 against · +17.3 per game');
    expect(card?.team).toBe('michigan');
  });

  it('ignores a trailing slash', () => {
    expect(resolveOgCard('/record/', NOW)).toEqual(resolveOgCard('/record', NOW));
  });

  it('has no card for a meeting that never happened', () => {
    expect(resolveOgCard('/record/1888', NOW)).toBeNull();
  });

  it('has no card for a page that ships its own artwork', () => {
    expect(resolveOgCard('/mo-carmen', NOW)).toBeNull();
  });
});

describe('ogImagePathFor', () => {
  it('names the home card', () => {
    expect(ogImagePathFor('/')).toBe('/og/home.png');
  });

  it('mirrors the page path for every other card', () => {
    expect(ogImagePathFor('/rivalry-lab/about')).toBe('/og/rivalry-lab/about.png');
    expect(ogImagePathFor('/record/1969')).toBe('/og/record/1969.png');
  });

  it('falls back to the site card rather than pointing at a missing image', () => {
    expect(ogImagePathFor('/mo-carmen')).toBe(DEFAULT_OG_IMAGE_PATH);
    expect(ogImagePathFor('/nothing-here')).toBe(DEFAULT_OG_IMAGE_PATH);
  });
});

describe('pagePathForOgRoute', () => {
  it('round-trips every page path through its image path', () => {
    for (const page of ['/', '/countdown', '/preview', '/record', '/record/2024', '/teams/michigan/1997']) {
      const route = ogImagePathFor(page).replace('/og/', '');
      expect(pagePathForOgRoute(route)).toBe(page);
    }
  });

  it('rejects anything that is not a card request', () => {
    expect(pagePathForOgRoute(undefined)).toBeNull();
    expect(pagePathForOgRoute('record/2024')).toBeNull();
    expect(pagePathForOgRoute('../../etc/passwd.png')).toBeNull();
    expect(pagePathForOgRoute('record//2024.png')).toBeNull();
  });
});

describe('ogCardAlt', () => {
  it('reads back every word drawn on the card', () => {
    expect(
      ogCardAlt({
        eyebrow: 'EVERY MEETING',
        headline: 'THE RECORD',
        detail: 'All 121 meetings',
        team: 'rivalry',
      })
    ).toBe('EVERY MEETING. THE RECORD. All 121 meetings');
  });

  it('reads the oversized figure and the colored spans', () => {
    expect(
      ogCardAlt({
        eyebrow: 'COUNTDOWN',
        metric: { value: '103', unit: 'DAYS' },
        headline: [{ text: 'OHIO STATE', tone: 'ohio-state' }, { text: '27–9' }],
        detail: 'Columbus',
        team: 'rivalry',
      })
    ).toBe('COUNTDOWN. 103 DAYS. OHIO STATE 27–9. Columbus');
  });
});

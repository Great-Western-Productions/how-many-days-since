import { describe, expect, it } from 'vitest';
import { FINAL_AFTER_MS, countdownDescription, countdownTitle, gameEventSchema, gamePhase, kickoffLine } from '../game-event';
import { nextGameDateLabel, type RivalryGameSchedule } from '../next-rivalry-game';

/**
 * The 2026 meeting, fixed here so these tests describe the functions and not
 * whichever game the live record points at. The record moves every season.
 */
const nextRivalryGame: RivalryGameSchedule = {
  name: 'Michigan vs. Ohio State',
  start: '2026-11-28T12:00:00-05:00',
  end: '2026-11-28T15:30:00-05:00',
  date: 'November 28, 2026',
  time: 'Noon ET',
  location: 'Columbus',
  timeZone: 'America/New_York',
  dateAnnounced: true,
  venue: { name: 'Ohio Stadium', streetAddress: '411 Woody Hayes Drive', region: 'OH', postalCode: '43210' },
  homeTeam: { name: 'Ohio State Buckeyes', url: 'https://ohiostatebuckeyes.com' },
  awayTeam: { name: 'Michigan Wolverines' },
};

const IMAGE = 'https://howmanydayssincemichiganhasbeatenohiostate.com/og/countdown.png';
const PAGE = 'https://howmanydayssincemichiganhasbeatenohiostate.com/countdown/';

describe('countdownTitle', () => {
  it('leads with the days-until question and the season year', () => {
    expect(countdownTitle(nextRivalryGame)).toBe(
      'Days Until Ohio State vs Michigan 2026: Countdown to The Game'
    );
  });
});

describe('countdownDescription', () => {
  it('names the day, the date, the kickoff time and the stadium', () => {
    expect(countdownDescription(nextRivalryGame)).toBe(
      'Live countdown to Ohio State vs Michigan on Saturday, November 28, 2026. Kickoff is noon ET at Ohio Stadium in Columbus.'
    );
  });
});

describe('gameEventSchema', () => {
  const schema = gameEventSchema(nextRivalryGame, { image: IMAGE, url: PAGE })!;

  it('keeps the kickoff and adds the fields Search Console reported missing', () => {
    expect(schema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: 'Michigan vs. Ohio State',
      startDate: '2026-11-28T12:00:00-05:00',
      endDate: '2026-11-28T15:30:00-05:00',
      eventStatus: 'https://schema.org/EventScheduled',
      image: [IMAGE],
      url: PAGE,
    });
    expect(schema.description).toBe(countdownDescription(nextRivalryGame));
  });

  it('places the game at the stadium with a full postal address', () => {
    expect(schema.location).toEqual({
      '@type': 'Place',
      name: 'Ohio Stadium',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '411 Woody Hayes Drive',
        addressLocality: 'Columbus',
        addressRegion: 'OH',
        postalCode: '43210',
        addressCountry: 'US',
      },
    });
  });

  it('names both teams as performers and the host as organizer', () => {
    expect(schema.homeTeam).toEqual({ '@type': 'SportsTeam', name: 'Ohio State Buckeyes' });
    expect(schema.awayTeam).toEqual({ '@type': 'SportsTeam', name: 'Michigan Wolverines' });
    expect(schema.performer).toEqual([schema.homeTeam, schema.awayTeam]);
    expect(schema.organizer).toEqual({
      '@type': 'Organization',
      name: 'Ohio State Buckeyes',
      url: 'https://ohiostatebuckeyes.com',
    });
  });

  it('states no ticket offer, since the site sells none', () => {
    expect(schema).not.toHaveProperty('offers');
  });
});

/** The 2027 meeting as it stands before the Big Ten sets a date. */
const UNANNOUNCED: RivalryGameSchedule = {
  ...nextRivalryGame,
  name: 'Ohio State vs. Michigan',
  start: '2027-11-27T12:00:00-05:00',
  end: '2027-11-27T15:30:00-05:00',
  date: 'November 27, 2027',
  time: 'Time TBA',
  location: 'Ann Arbor',
  dateAnnounced: false,
  venue: { name: 'Michigan Stadium', streetAddress: '1201 S Main St', region: 'MI', postalCode: '48104' },
  homeTeam: { name: 'Michigan Wolverines', url: 'https://mgoblue.com' },
  awayTeam: { name: 'Ohio State Buckeyes' },
};

describe('gamePhase', () => {
  const at = (iso: string) => gamePhase(nextRivalryGame, new Date(iso));

  it('runs the countdown until game day', () => {
    expect(at('2026-11-27T23:59:00-05:00')).toBe('upcoming');
  });

  it('calls it game day from midnight Eastern until kickoff', () => {
    expect(at('2026-11-28T00:00:00-05:00')).toBe('game-day');
    expect(at('2026-11-28T11:59:59-05:00')).toBe('game-day');
  });

  it('holds the game in progress from kickoff for four hours', () => {
    expect(at('2026-11-28T12:00:00-05:00')).toBe('in-progress');
    expect(at('2026-11-28T15:59:59-05:00')).toBe('in-progress');
    expect(FINAL_AFTER_MS).toBe(4 * 60 * 60 * 1_000);
  });

  it('calls it final after that, until the next game moves on', () => {
    expect(at('2026-11-28T16:00:00-05:00')).toBe('final');
    expect(at('2026-12-15T12:00:00-05:00')).toBe('final');
  });
});

describe('a next game whose date is not announced', () => {
  it('labels the date as expected', () => {
    expect(nextGameDateLabel(UNANNOUNCED)).toBe('November 27, 2027 (expected)');
    expect(nextGameDateLabel(nextRivalryGame)).toBe('November 28, 2026');
    expect(kickoffLine(UNANNOUNCED)).toBe('NOVEMBER 27, 2027 (EXPECTED) · TIME TBA · ANN ARBOR');
  });

  it('says the date and kickoff are not announced', () => {
    expect(countdownTitle(UNANNOUNCED)).toBe('Days Until Ohio State vs Michigan 2027: Countdown to The Game');
    expect(countdownDescription(UNANNOUNCED)).toBe(
      'Live countdown to Ohio State vs Michigan, expected on Saturday, November 27, 2027, at Michigan Stadium in Ann Arbor. The Big Ten has not announced the date or kickoff time.'
    );
  });

  it('states the kickoff when the time is set ahead of the date', () => {
    expect(countdownDescription({ ...UNANNOUNCED, time: 'Noon ET' })).toBe(
      'Live countdown to Ohio State vs Michigan, expected on Saturday, November 27, 2027, at Michigan Stadium in Ann Arbor. Kickoff is noon ET. The Big Ten has not announced the date.'
    );
  });

  it('publishes no event markup', () => {
    expect(gameEventSchema(UNANNOUNCED, { image: IMAGE, url: PAGE })).toBeNull();
  });

  it('describes an announced date with the kickoff still to come', () => {
    expect(countdownDescription({ ...UNANNOUNCED, dateAnnounced: true })).toBe(
      'Live countdown to Ohio State vs Michigan on Saturday, November 27, 2027, at Michigan Stadium in Ann Arbor. Kickoff time has not been announced.'
    );
  });
});

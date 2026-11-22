import { describe, expect, it } from 'vitest';
import { countdownDescription, countdownTitle, gameEventSchema } from '../game-event';
import { nextRivalryGame } from '../next-rivalry-game';

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
  const schema = gameEventSchema(nextRivalryGame, { image: IMAGE, url: PAGE });

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

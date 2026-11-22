/**
 * The countdown page's title, description and event markup, built from the
 * one record of the next game so the three cannot disagree.
 */
import type { nextRivalryGame } from './next-rivalry-game';

type Game = typeof nextRivalryGame;

const weekday = (game: Game) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: game.timeZone }).format(new Date(game.start));

/** "Noon ET" reads as "noon ET" mid-sentence; "3:30 PM ET" is left alone. */
const kickoffInSentence = (game: Game) => `${game.time.charAt(0).toLowerCase()}${game.time.slice(1)}`;

/** Leads with the phrasing people search in the weeks before the game. */
export function countdownTitle(game: Game): string {
  return `Days Until Ohio State vs Michigan ${game.start.slice(0, 4)}: Countdown to The Game`;
}

export function countdownDescription(game: Game): string {
  return `Live countdown to Ohio State vs Michigan on ${weekday(game)}, ${game.date}. Kickoff is ${kickoffInSentence(game)} at ${game.venue.name} in ${game.location}.`;
}

/**
 * schema.org SportsEvent for the next game. No `offers`: the site sells no
 * tickets, and an offer has to point at a page that does.
 */
export function gameEventSchema(game: Game, page: { image: string; url: string }) {
  const homeTeam = { '@type': 'SportsTeam', name: game.homeTeam.name };
  const awayTeam = { '@type': 'SportsTeam', name: game.awayTeam.name };
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: game.name,
    description: countdownDescription(game),
    url: page.url,
    image: [page.image],
    startDate: game.start,
    endDate: game.end,
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: game.venue.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: game.venue.streetAddress,
        addressLocality: game.location,
        addressRegion: game.venue.region,
        postalCode: game.venue.postalCode,
        addressCountry: 'US',
      },
    },
    homeTeam,
    awayTeam,
    performer: [homeTeam, awayTeam],
    organizer: { '@type': 'Organization', name: game.homeTeam.name, url: game.homeTeam.url },
  };
}

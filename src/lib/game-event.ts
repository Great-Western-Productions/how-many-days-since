/**
 * The countdown page's title, description and event markup, built from the
 * one record of the next game so the three cannot disagree.
 */
import { columbusCalendarDay } from './days';
import { nextGameDateLabel, type RivalryGameSchedule } from './next-rivalry-game';

type Game = RivalryGameSchedule;

/**
 * Where the countdown stands against the next game:
 * - `upcoming`: before game day, the clock runs.
 * - `game-day`: game day before kickoff, the clock runs under a game-day line.
 * - `in-progress`: from kickoff until `FINAL_AFTER_MS` past it.
 * - `final`: after that, until the result goes into the record and the next
 *   game moves on a season, which puts the page back to `upcoming`.
 */
export type GamePhase = 'upcoming' | 'game-day' | 'in-progress' | 'final';

/**
 * Four hours from kickoff. A televised game runs about three and a half, and
 * calling it final while the fourth quarter is still on would be wrong, so the
 * page waits past the schema's `endDate`.
 */
export const FINAL_AFTER_MS = 4 * 60 * 60 * 1_000;

export function gamePhase(game: Pick<Game, 'start'>, now: Date): GamePhase {
  const kickoff = new Date(game.start);
  const elapsed = now.getTime() - kickoff.getTime();
  if (elapsed >= FINAL_AFTER_MS) return 'final';
  if (elapsed >= 0) return 'in-progress';
  return columbusCalendarDay(now) === columbusCalendarDay(kickoff) ? 'game-day' : 'upcoming';
}

/**
 * When the phase next changes: midnight Eastern on game day, kickoff, then
 * `FINAL_AFTER_MS` past it. `null` once final, since only a new next game in
 * the record moves the page on from there.
 */
export function nextPhaseChange(game: Pick<Game, 'start'>, now: Date): Date | null {
  const kickoff = new Date(game.start);
  // `start` carries its Eastern offset, so its date and offset give midnight.
  const gameDayStart = new Date(`${game.start.slice(0, 10)}T00:00:00${game.start.slice(19)}`);
  for (const change of [gameDayStart, kickoff, new Date(kickoff.getTime() + FINAL_AFTER_MS)]) {
    if (change.getTime() > now.getTime()) return change;
  }
  return null;
}

/** "NOVEMBER 28, 2026 · NOON ET · COLUMBUS", the line under the countdown heading. */
export function kickoffLine(game: Game): string {
  return `${nextGameDateLabel(game)} · ${game.time} · ${game.location}`.toUpperCase();
}

const weekday = (game: Game) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: game.timeZone }).format(new Date(game.start));

/** "Noon ET" reads as "noon ET" mid-sentence; "3:30 PM ET" is left alone. */
export const kickoffInSentence = (game: Pick<Game, 'time'>) => `${game.time.charAt(0).toLowerCase()}${game.time.slice(1)}`;

/** Leads with the phrasing people search in the weeks before the game. */
export function countdownTitle(game: Game): string {
  return `Days Until Ohio State vs Michigan ${game.start.slice(0, 4)}: Countdown to The Game`;
}

export function countdownDescription(game: Game): string {
  if (!game.dateAnnounced) {
    return `Live countdown to Ohio State vs Michigan, expected on ${weekday(game)}, ${game.date}, at ${game.venue.name} in ${game.location}. The Big Ten has not announced the date or kickoff time.`;
  }
  if (/TBA/.test(game.time)) {
    return `Live countdown to Ohio State vs Michigan on ${weekday(game)}, ${game.date}, at ${game.venue.name} in ${game.location}. Kickoff time has not been announced.`;
  }
  return `Live countdown to Ohio State vs Michigan on ${weekday(game)}, ${game.date}. Kickoff is ${kickoffInSentence(game)} at ${game.venue.name} in ${game.location}.`;
}

/**
 * schema.org SportsEvent for the next game. No `offers`: the site sells no
 * tickets, and an offer has to point at a page that does. `null` while the
 * date is unannounced, since an event's date is the one field it cannot guess.
 */
export function gameEventSchema(game: Game, page: { image: string; url: string }) {
  if (!game.dateAnnounced) return null;
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

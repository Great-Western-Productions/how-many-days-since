/**
 * The next meeting, as the countdown, the next-game lines and the event markup
 * read it. Moving to the following season is an edit to this record alone.
 */
export interface RivalryGameSchedule {
  name: string;
  /** Kickoff, with its Eastern offset. For a date not yet announced, the expected day at noon. */
  start: string;
  end: string;
  /** "November 28, 2026" */
  date: string;
  /** "Noon ET", or "Time TBA" before the kickoff is set. */
  time: string;
  location: string;
  timeZone: string;
  /**
   * False while the conference has not published the date, so `date` and
   * `start` are the expected Saturday. The pages say so, and no event markup
   * goes out for a date nobody has confirmed.
   */
  dateAnnounced: boolean;
  venue: {
    name: string;
    streetAddress: string;
    region: string;
    postalCode: string;
  };
  homeTeam: { name: string; url: string };
  awayTeam: { name: string };
}

export const nextRivalryGame: RivalryGameSchedule = {
  name: 'Michigan vs. Ohio State',
  start: '2026-11-28T12:00:00-05:00',
  // No listing publishes a final whistle. Three and a half hours covers a
  // televised noon game, and search engines ask for an end on every event.
  end: '2026-11-28T15:30:00-05:00',
  date: 'November 28, 2026',
  time: 'Noon ET',
  location: 'Columbus',
  timeZone: 'America/New_York',
  dateAnnounced: true,
  venue: {
    name: 'Ohio Stadium',
    streetAddress: '411 Woody Hayes Drive',
    region: 'OH',
    postalCode: '43210',
  },
  homeTeam: { name: 'Ohio State Buckeyes', url: 'https://ohiostatebuckeyes.com' },
  awayTeam: { name: 'Michigan Wolverines' },
};

/** "November 28, 2026", or "November 27, 2027 (expected)" before the date is set. */
export function nextGameDateLabel(game: RivalryGameSchedule): string {
  return game.dateAnnounced ? game.date : `${game.date} (expected)`;
}

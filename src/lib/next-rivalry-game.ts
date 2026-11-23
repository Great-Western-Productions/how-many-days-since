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
  name: 'Ohio State vs. Michigan',
  // The Big Ten has not set the 2027 date. The Game has closed the regular
  // season on the Saturday after Thanksgiving, so that is the expected day.
  start: '2027-11-27T12:00:00-05:00',
  end: '2027-11-27T15:30:00-05:00',
  date: 'November 27, 2027',
  time: 'Time TBA',
  location: 'Ann Arbor',
  timeZone: 'America/New_York',
  dateAnnounced: false,
  venue: {
    name: 'Michigan Stadium',
    streetAddress: '1201 S Main St',
    region: 'MI',
    postalCode: '48104',
  },
  homeTeam: { name: 'Michigan Wolverines', url: 'https://mgoblue.com' },
  awayTeam: { name: 'Ohio State Buckeyes' },
};

/** "November 28, 2026", or "November 27, 2027 (expected)" before the date is set. */
export function nextGameDateLabel(game: RivalryGameSchedule): string {
  return game.dateAnnounced ? game.date : `${game.date} (expected)`;
}

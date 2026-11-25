/**
 * The sentence form of a day count: the number, today's date, the game the
 * count starts from, and how the number is reached.
 *
 * The page text and the FAQPage answer are both built here, so the passage a
 * search or answer engine quotes is the same one a reader sees.
 */
import type { WinAnchor } from './rivalry-anchors';
import { formatDayCount } from './share-graphic';

/** `calcDaysSince` in words. */
export const COUNT_METHOD = "The count is the number of calendar days from the date of that game to today's date in Eastern Time.";

/** The facts about the last win that the statement reads, small enough to ride on data attributes. */
export type CountFacts = Pick<WinAnchor, 'team' | 'score' | 'location' | 'longDate'>;

const opponentOf = (team: CountFacts['team']) => (team === 'Michigan' ? 'Ohio State' : 'Michigan');

/** `today` is the Eastern date as the page prints it: "Tuesday, November 24, 2026". */
export function countStatement(win: CountFacts, days: number, today: string): string {
  return [
    `As of ${today}, it has been ${formatDayCount(days)} since ${win.team} last beat ${opponentOf(win.team)}.`,
    `${win.team} won ${win.score} in ${win.location} on ${win.longDate}.`,
    COUNT_METHOD,
  ].join(' ');
}

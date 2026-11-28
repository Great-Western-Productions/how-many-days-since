/**
 * How long a game's result leads the pages. Kept apart from the record so the
 * browser can ask the question without loading every game.
 */
import { calcDaysSince } from './days';

/** How many days after a game its result leads every page. */
export const RESULT_FRESH_DAYS = 7;

/**
 * Whether a game that kicked off at `kickoff` still leads the pages at `now`.
 * The server asks when it renders and the browser asks again on load, since
 * the archive pages are prerendered and would keep a banner baked in.
 */
export function resultIsFresh(kickoff: Date, now: Date): boolean {
  return kickoff.getTime() <= now.getTime() && calcDaysSince(kickoff, now) <= RESULT_FRESH_DAYS;
}

/**
 * The most recent game as the pages announce it, and the series totals.
 *
 * Read out of `rivalry-games.json`, so the result banner, the share graphic
 * and the preview's final line change when a game is added to the record.
 */
import games from '../data/rivalry-games.json';
import { calcDaysSince } from './days';
import { gameKickoffIso, gameLongDate, latestGame, type RivalryGameRow } from './rivalry-anchors';

/** How many days after a game its result leads every page. */
export const RESULT_FRESH_DAYS = 7;

export interface GameResult {
  year: number;
  /** "Ohio State", "Michigan" or "Tie". */
  winner: string;
  loser: string;
  /** "45-0", winner's points first. */
  score: string;
  /** "November 28, 2026" */
  longDate: string;
  location: string;
  /** "OHIO STATE WINS THE GAME, 45-0" */
  headline: string;
  /** The winner's color class, or none for a tie. */
  team: 'osu' | 'mich' | undefined;
}

export function gameResult(game: RivalryGameRow): GameResult {
  const score = `${game.wScore}-${game.lScore}`;
  const tie = game.winner === 'Tie';
  return {
    year: game.year,
    winner: game.winner,
    loser: game.loser,
    score,
    longDate: gameLongDate(game),
    location: game.location ?? 'Site not reported',
    headline: tie ? `THE GAME ENDS IN A TIE, ${score}` : `${game.winner.toUpperCase()} WINS THE GAME, ${score}`,
    team: game.winner === 'Ohio State' ? 'osu' : game.winner === 'Michigan' ? 'mich' : undefined,
  };
}

/** The latest game, while it is at most `RESULT_FRESH_DAYS` Eastern calendar days old. */
export function freshResult(now: Date, rows: readonly RivalryGameRow[] = games): GameResult | null {
  const game = latestGame(rows);
  const kickoff = new Date(gameKickoffIso(game));
  if (kickoff.getTime() > now.getTime()) return null;
  return calcDaysSince(kickoff, now) <= RESULT_FRESH_DAYS ? gameResult(game) : null;
}

/** The result of the game played in `year`, if the record holds one. */
export function resultFor(year: number, rows: readonly RivalryGameRow[] = games): GameResult | null {
  const game = rows.find((row) => row.year === year);
  return game ? gameResult(game) : null;
}

/** Wins and ties across the record, as the series line states them: Michigan first. */
export function seriesRecord(rows: readonly RivalryGameRow[] = games) {
  const count = (winner: string) => rows.filter((game) => game.winner === winner).length;
  return { michigan: count('Michigan'), ohioState: count('Ohio State'), ties: count('Tie') };
}

/** What the share graphic prints in its series panel, with the en dashes the card uses. */
export function shareGraphicPanel(rows: readonly RivalryGameRow[] = games) {
  const game = latestGame(rows);
  const series = seriesRecord(rows);
  return {
    latest: game.winner === 'Tie' ? `TIE ${game.wScore}–${game.lScore}` : `${game.winner.toUpperCase()} ${game.wScore}–${game.lScore}`,
    latestTeam: gameResult(game).team,
    series: `${series.michigan}–${series.ohioState}–${series.ties}`,
  };
}

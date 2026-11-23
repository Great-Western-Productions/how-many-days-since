/**
 * Reads the game-week preview exported by the private model workspace and
 * turns its numbers into the words the preview page prints.
 *
 * The JSON is a derived artifact: each number comes from regular-season games
 * played before the meeting it describes. `npm run sync:preview` replaces it.
 */
import data from '../data/rivalry-preview.json';

export type TeamId = 'ohio-state' | 'michigan';
export type BandId = 'scoring' | 'rushing' | 'passing' | 'third-down' | 'red-zone' | 'turnovers' | 'first-downs';

/**
 * `offense` is what the team's offense produces and `defense` what its defense
 * gives up. The turnover band is the exception: offense is giveaways and
 * defense is takeaways.
 */
export type Side = { offense: number | null; defense: number | null; net: number | null };
export type Tally = { since: number; won: number; of: number };
export type RecordLine = { wins: number; losses: number; ties: number };

export type Band = {
  id: BandId;
  label: string;
  unit: string;
  sides: Record<TeamId, Side>;
  edge: { teamId: TeamId; margin: number } | null;
  history: Tally[];
  missedSeasons: number[];
};

export type PreviewTeam = RecordLine & {
  games: number;
  boxGames: number;
  apRank: number | null;
  pointsPerGame: number | null;
  pointsAllowedPerGame: number | null;
};

export type PastTape = { season: number; winner: TeamId; edges: Record<TeamId, number> };

export type Twin = {
  season: number;
  distance: number;
  homeTeamId: TeamId;
  winner: TeamId | 'tie';
  score: Record<TeamId, number>;
  records: Record<TeamId, RecordLine>;
};

export type OpponentResult = { site: 'home' | 'away' | 'neutral'; date: string; pointsFor: number; pointsAgainst: number };
export type CommonOpponent = { opponent: string } & Record<TeamId, OpponentResult>;

export type RivalryPreview = {
  schemaVersion: string;
  generatedAt: string;
  dataThrough: string | null;
  game: { season: number; date: string; homeTeamId: TeamId };
  coverage: { stats: { since: number; meetings: number }; scores: { since: number; meetings: number } };
  pollWeek: number | null;
  teams: Record<TeamId, PreviewTeam>;
  tape: Band[];
  home: Tally[];
  pastTapes: PastTape[];
  twins: Twin[];
  commonOpponents: {
    rows: CommonOpponent[];
    averageMargin: Record<TeamId, number | null>;
    edge: TeamId | null;
    history: Tally[];
  };
};

export const rivalryPreview = data as unknown as RivalryPreview;

export const TEAM_IDS: TeamId[] = ['ohio-state', 'michigan'];
export const TEAM_NAMES: Record<TeamId, string> = { 'ohio-state': 'Ohio State', michigan: 'Michigan' };
export const otherTeam = (teamId: TeamId): TeamId => (teamId === 'ohio-state' ? 'michigan' : 'ohio-state');
/** The site's color classes: scarlet for Ohio State, blue for Michigan. */
export const teamClass = (teamId: TeamId): 'osu' | 'mich' => (teamId === 'ohio-state' ? 'osu' : 'mich');
export const cityFor = (homeTeamId: TeamId): string => (homeTeamId === 'ohio-state' ? 'Columbus' : 'Ann Arbor');

export const formatRecord = (record: RecordLine): string => `${record.wins}-${record.losses}${record.ties ? `-${record.ties}` : ''}`;
export const rankText = (rank: number | null): string => (rank === null ? 'Unranked' : `AP No. ${rank}`);

type BandFormat = { places: number; percent?: boolean; edgeUnit: string; offense: string; defense: string };

const FORMATS: Record<BandId, BandFormat> = {
  scoring: { places: 1, edgeUnit: 'points per game', offense: 'scored', defense: 'allowed' },
  rushing: { places: 2, edgeUnit: 'yards per carry', offense: 'gained', defense: 'allowed' },
  passing: { places: 1, edgeUnit: 'yards per attempt', offense: 'gained', defense: 'allowed' },
  'third-down': { places: 1, percent: true, edgeUnit: 'percentage points', offense: 'converted', defense: 'allowed' },
  'red-zone': { places: 1, percent: true, edgeUnit: 'percentage points', offense: 'scored', defense: 'allowed' },
  turnovers: { places: 2, edgeUnit: 'per game', offense: 'given away', defense: 'taken away' },
  'first-downs': { places: 1, edgeUnit: 'per game', offense: 'gained', defense: 'allowed' },
};

function formatNumber(id: BandId, value: number): string {
  const { places, percent } = FORMATS[id];
  return percent ? `${(value * 100).toFixed(places)}%` : value.toFixed(places);
}

/** One side of a matchup as the page prints it: "34.3 scored", "45.3% converted". */
export function formatBandValue(id: BandId, role: 'offense' | 'defense', value: number | null): string {
  return value === null ? 'No data' : `${formatNumber(id, value)} ${FORMATS[id][role]}`;
}

/** "Ohio State +5.7 per game". Rate bands report the gap in percentage points. */
export function formatEdge(band: Band): string {
  if (!band.edge) return 'Even';
  const { places, percent, edgeUnit } = FORMATS[band.id];
  const margin = percent ? band.edge.margin * 100 : band.edge.margin;
  return `${TEAM_NAMES[band.edge.teamId]} +${margin.toFixed(places)} ${edgeUnit}`;
}

export type Matchup = { label: string; ohioState: string; michigan: string };

/**
 * The two rows of a band, each one team's offense against the other's defense.
 * Ohio State's number sits on the left in both, so the columns stay one team each.
 */
export function matchups(band: Band): [Matchup, Matchup] {
  const ohioState = band.sides['ohio-state'];
  const michigan = band.sides.michigan;
  return [
    {
      label: 'Ohio State offense vs Michigan defense',
      ohioState: formatBandValue(band.id, 'offense', ohioState.offense),
      michigan: formatBandValue(band.id, 'defense', michigan.defense),
    },
    {
      label: 'Michigan offense vs Ohio State defense',
      ohioState: formatBandValue(band.id, 'defense', ohioState.defense),
      michigan: formatBandValue(band.id, 'offense', michigan.offense),
    },
  ];
}

/** "17 of 21 since 2004". A count, never a percentage: the samples are small. */
export const historyText = (tally: Tally): string => `${tally.won} of ${tally.of} since ${tally.since}`;

export function edgesHeld(tape: Band[]): Record<TeamId, number> {
  return {
    'ohio-state': tape.filter((band) => band.edge?.teamId === 'ohio-state').length,
    michigan: tape.filter((band) => band.edge?.teamId === 'michigan').length,
  };
}

/**
 * How the team holding more edges has fared, and the meeting where the tape
 * was furthest off: the winner that held the fewest edges.
 */
export function tapeRecord(pastTapes: PastTape[]): { won: number; of: number; upset: PastTape | null } {
  let won = 0;
  let of = 0;
  let upset: PastTape | null = null;
  for (const tape of pastTapes) {
    const loser = otherTeam(tape.winner);
    if (tape.edges[tape.winner] === tape.edges[loser]) continue;
    of += 1;
    if (tape.edges[tape.winner] > tape.edges[loser]) {
      won += 1;
    } else if (!upset || tape.edges[loser] - tape.edges[tape.winner] >= upset.edges[otherTeam(upset.winner)] - upset.edges[upset.winner]) {
      // Ties go to the later season, the one readers remember.
      upset = tape;
    }
  }
  return { won, of, upset };
}

/** "Ohio State won all 3." or "Ohio State won 2 of the 3." */
export function twinSummary(twins: Twin[]): string {
  if (twins.length === 0) return '';
  const wins = (teamId: TeamId) => twins.filter((twin) => twin.winner === teamId).length;
  const leader: TeamId = wins('ohio-state') >= wins('michigan') ? 'ohio-state' : 'michigan';
  if (wins(leader) === wins(otherTeam(leader))) return 'The closest meetings split evenly.';
  if (wins(leader) === twins.length) return `${TEAM_NAMES[leader]} won ${twins.length === 1 ? 'it' : `all ${twins.length}`}.`;
  return `${TEAM_NAMES[leader]} won ${wins(leader)} of the ${twins.length}.`;
}

/** "W 31-14" from the listed team's side. */
export function resultText(result: OpponentResult): string {
  const letter = result.pointsFor > result.pointsAgainst ? 'W' : result.pointsFor < result.pointsAgainst ? 'L' : 'T';
  return `${letter} ${result.pointsFor}-${result.pointsAgainst}`;
}

export const marginText = (margin: number | null): string => (margin === null ? 'No data' : `${margin > 0 ? '+' : ''}${margin.toFixed(1)}`);

/** "November 21" from an ISO date, read as a calendar date with no time zone shift. */
export function monthDay(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

// Kickoff comes from the preview's own game record. The page keeps describing the game
// it was built for after `next-rivalry-game.ts` moves on to the following season.
const EASTERN = 'America/New_York';
const kickoffPart = (preview: RivalryPreview, options: Intl.DateTimeFormatOptions): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: EASTERN, ...options }).format(new Date(preview.game.date));

/** "November 28, 2026", on the Eastern calendar. */
export const kickoffDate = (preview: RivalryPreview): string => kickoffPart(preview, { month: 'long', day: 'numeric', year: 'numeric' });
export const kickoffWeekday = (preview: RivalryPreview): string => kickoffPart(preview, { weekday: 'long' });

/** "Noon ET" for the traditional kickoff, "3:30 PM ET" otherwise. */
export function kickoffTime(preview: RivalryPreview): string {
  const time = kickoffPart(preview, { hour: 'numeric', minute: '2-digit' });
  return `${time === '12:00 PM' ? 'Noon' : time} ET`;
}

export function previewTitle(preview: RivalryPreview): string {
  return `Ohio State vs Michigan ${preview.game.season} Preview: Tale of the Tape`;
}

export function previewDescription(preview: RivalryPreview): string {
  const home = preview.game.homeTeamId;
  const team = (teamId: TeamId) => `${TEAM_NAMES[teamId]} (${formatRecord(preview.teams[teamId])})`;
  return `${team(home)} hosts ${team(otherTeam(home))} on ${kickoffWeekday(preview)}, ${kickoffDate(preview)}. Unit-by-unit matchups, how often each edge has won The Game, and the closest past meetings.`;
}

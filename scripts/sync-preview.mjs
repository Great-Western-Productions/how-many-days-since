import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TEAMS = ['ohio-state', 'michigan'];
const BANDS = ['scoring', 'rushing', 'passing', 'third-down', 'red-zone', 'turnovers', 'first-downs'];

const source = process.argv[2];
if (!source) throw new Error('Pass the exported preview path as the first argument.');
const raw = readFileSync(resolve(source), 'utf8');
const preview = JSON.parse(raw);

if (preview.schemaVersion !== 'rivalry-preview-v1') throw new Error('Source is not a supported game-week preview.');
if (!Number.isInteger(preview.game?.season) || !TEAMS.includes(preview.game?.homeTeamId)) throw new Error('Source preview does not name the game it describes.');
for (const teamId of TEAMS) {
  if (!Number.isInteger(preview.teams?.[teamId]?.wins)) throw new Error(`Source preview is missing the ${teamId} record.`);
}

const numberOrNull = (value) => value === null || Number.isFinite(value);
const tally = (entry) => Number.isInteger(entry?.since) && Number.isInteger(entry?.won) && Number.isInteger(entry?.of) && entry.won <= entry.of;
if (!Array.isArray(preview.tape) || BANDS.some((id) => preview.tape.filter((band) => band.id === id).length !== 1) || preview.tape.length !== BANDS.length) {
  throw new Error('Source preview does not carry each tape band once.');
}
for (const band of preview.tape) {
  for (const teamId of TEAMS) {
    const side = band.sides?.[teamId];
    if (!side || !['offense', 'defense', 'net'].every((field) => numberOrNull(side[field]))) throw new Error(`Source preview band ${band.id} has a malformed ${teamId} side.`);
  }
  if (band.edge !== null && !TEAMS.includes(band.edge?.teamId)) throw new Error(`Source preview band ${band.id} names an edge outside the public contract.`);
  if (!Array.isArray(band.history) || band.history.length === 0 || !band.history.every(tally)) throw new Error(`Source preview band ${band.id} has a malformed history.`);
}
if (!Array.isArray(preview.home) || !preview.home.every(tally)) throw new Error('Source preview has a malformed home-field history.');
if (!Array.isArray(preview.twins) || preview.twins.some((twin) => !Number.isInteger(twin.season) || !TEAMS.includes(twin.homeTeamId))) throw new Error('Source preview has a malformed list of past meetings.');
if (!Array.isArray(preview.commonOpponents?.rows) || !preview.commonOpponents.history?.every(tally)) throw new Error('Source preview has a malformed common-opponent block.');

for (const privateKey of ['payload_json', 'source_identifier', 'sourceIdentifier', 'sourceGameId', 'sourceRecordId', 'teamGameStats', 'game_drives']) {
  if (raw.includes(privateKey)) throw new Error(`Source preview leaks private warehouse data (${privateKey}).`);
}

writeFileSync('src/data/rivalry-preview.json', `${JSON.stringify(preview, null, 2)}\n`);
console.log(`Synced the ${preview.game.season} preview with data through ${preview.dataThrough} from ${resolve(source)}.`);

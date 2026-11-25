import { describe, expect, it } from 'vitest';
import { COUNT_METHOD, countStatement } from '../count-statement';
import { lastMichiganWin, lastOhioStateWin } from '../rivalry-anchors';

const TODAY = 'Tuesday, November 24, 2026';

describe('countStatement', () => {
  it('states the count, today, the last win and the method in one passage', () => {
    expect(countStatement(lastMichiganWin, 724, TODAY)).toBe(
      'As of Tuesday, November 24, 2026, it has been 724 days since Michigan last beat Ohio State. ' +
        'Michigan won 13-10 in Columbus on November 30, 2024. ' +
        "The count is the number of calendar days from the date of that game to today's date in Eastern Time."
    );
  });

  it('names the other side when Ohio State holds the last win', () => {
    expect(countStatement(lastOhioStateWin, 360, TODAY)).toContain(
      'it has been 360 days since Ohio State last beat Michigan. Ohio State won 27-9 in Ann Arbor on November 29, 2025.'
    );
  });

  it('reads one day in the singular and separates thousands', () => {
    expect(countStatement(lastMichiganWin, 1, TODAY)).toContain('it has been 1 day since');
    expect(countStatement(lastMichiganWin, 1000, TODAY)).toContain('it has been 1,000 days since');
  });

  it('ends on the method, so a quoted passage carries how the number is reached', () => {
    expect(countStatement(lastOhioStateWin, 360, TODAY).endsWith(COUNT_METHOD)).toBe(true);
  });

  it('needs the four facts a page hands its script, and no more', () => {
    const facts = { team: 'Michigan' as const, score: '13-10', location: 'Columbus', longDate: 'November 30, 2024' };
    expect(countStatement(facts, 724, TODAY)).toBe(countStatement(lastMichiganWin, 724, TODAY));
  });
});

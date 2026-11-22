export const nextRivalryGame = {
  name: 'Michigan vs. Ohio State',
  start: '2026-11-28T12:00:00-05:00',
  // No listing publishes a final whistle. Three and a half hours covers a
  // televised noon game, and search engines ask for an end on every event.
  end: '2026-11-28T15:30:00-05:00',
  date: 'November 28, 2026',
  time: 'Noon ET',
  location: 'Columbus',
  timeZone: 'America/New_York',
  venue: {
    name: 'Ohio Stadium',
    streetAddress: '411 Woody Hayes Drive',
    region: 'OH',
    postalCode: '43210',
  },
  homeTeam: { name: 'Ohio State Buckeyes', url: 'https://ohiostatebuckeyes.com' },
  awayTeam: { name: 'Michigan Wolverines' },
} as const;

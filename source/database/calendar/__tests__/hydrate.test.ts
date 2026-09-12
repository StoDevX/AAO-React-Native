import {hydrate, type OccurrenceRowResult} from '../hydrate'

const WIRE = JSON.stringify({
	dataSource: 'test',
	startTime: '2026-09-15T18:00:00Z',
	endTime: '2026-09-18T20:00:00Z',
	isAllDay: false,
	isMultiDay: true,
	isSameInstant: false,
	title: 'Soccer',
	description: 'A game',
	location: 'Field',
	isOngoing: true,
	links: [],
	categories: ['Sports'],
	organization: ['Athletics'],
	config: {startTime: true, endTime: true, subtitle: 'location'},
})

const ROW: OccurrenceRowResult = {
	source_id: 'stolaf',
	event_key: 'k1',
	dedupe_key: 'dk',
	wire: WIRE,
	start_utc: Date.parse('2026-09-15T18:00:00Z'),
}

describe('hydrate', () => {
	it('rebuilds a SourcedEvent with Moment times', () => {
		let [entry] = hydrate([ROW], new Map(), new Date('2026-09-15T19:00:00Z'))
		expect(entry.sourceId).toBe('stolaf')
		expect(entry.key).toBe('k1')
		expect(entry.event.title).toBe('Soccer')
		expect(entry.event.startTime.toISOString()).toBe('2026-09-15T18:00:00.000Z')
	})

	it('overrides organization with the cross-source union', () => {
		let sponsors = new Map([['dk', ['Athletics', 'Student Activities']]])
		let [entry] = hydrate([ROW], sponsors, new Date('2026-09-15T19:00:00Z'))
		expect(entry.event.organization).toEqual(['Athletics', 'Student Activities'])
	})

	it('de-duplicates a sponsor both copies name, keeping the winner-first order', () => {
		// `group_concat` cannot enforce `distinct` alongside its in-aggregate
		// `order by` (`organizationsQuery`'s ordering is load-bearing and
		// tested on its own) -- SQLite rejects
		// `group_concat(distinct value, separator order by ...)` outright
		// ("DISTINCT aggregates must have exactly one argument") -- so a name
		// both the winner and a displaced copy tag arrives here already
		// duplicated. `hydrate` has to collapse it the way the deleted
		// `dedupeEvents` did explicitly
		// (`modules/ccc-calendar/use-merged-events.ts`, pre-Task-9:
		// `.filter((name) => !sponsors.includes(name))`).
		let sponsors = new Map([['dk', ['Athletics', 'Student Activities', 'Athletics']]])
		let [entry] = hydrate([ROW], sponsors, new Date('2026-09-15T19:00:00Z'))
		expect(entry.event.organization).toEqual(['Athletics', 'Student Activities'])
	})

	it('leaves organization absent rather than empty when nothing sponsors it', () => {
		let [entry] = hydrate([ROW], new Map(), new Date('2026-09-15T19:00:00Z'))
		expect('organization' in entry.event).toBe(false)
	})

	it('derives isOngoing rather than trusting the stored value', () => {
		// The wire says isOngoing: true, frozen at parse time.
		//
		// `isOngoing` means "started on an earlier day and hasn't ended yet" --
		// matching what the parsers compute (see parsers/ical.ts) -- so a
		// same-day check can never satisfy it: `startTime < startOfDay(now)`
		// cannot be true while `now` is still on the day the event started.
		// The event above spans September 15-18, so "during" has to land on a
		// later day than the start for this to be decidable at all.
		let during = hydrate([ROW], new Map(), new Date('2026-09-16T19:00:00Z'))
		expect(during[0].event.isOngoing).toBe(true)

		let after = hydrate([ROW], new Map(), new Date('2026-09-19T00:00:00Z'))
		expect(after[0].event.isOngoing).toBe(false)
	})
})

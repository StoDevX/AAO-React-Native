import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {ensureSchema} from '../schema.ts'
import type {SqlRunner, Statement} from '../sql.ts'
import {openTestDatabase} from '../testing/harness.ts'
import {
	facetsQuery,
	occurrencesQuery,
	oneEventQuery,
	ORG_SEPARATOR,
	organizationsQuery,
	type Window,
} from './queries.ts'

export const WINDOW: Window = {
	fromUtc: Date.UTC(2026, 8, 14),
	toUtc: Date.UTC(2026, 8, 30),
	fromDate: '2026-09-14',
	toDate: '2026-09-30',
}

export function seed(): SqlRunner {
	let runner = openTestDatabase()
	ensureSchema(runner, 'test')

	let event = (id: string, key: string, rank: number, dk: string, title: string) =>
		runner.run({
			sql: 'insert into event values (?,?,?,?,?,?,?)',
			params: [id, key, rank, dk, title, 'Somewhere', '{}'],
		})
	let timed = (id: string, key: string, start: number, end: number) =>
		runner.run({
			sql: 'insert into occurrence values (?,?,0,?,?,null,null)',
			params: [id, key, start, end],
		})
	let allDay = (id: string, key: string, from: string, to: string) =>
		runner.run({
			sql: 'insert into occurrence values (?,?,1,0,0,?,?)',
			params: [id, key, from, to],
		})

	event('stolaf', 'inside', 0, 'dk-inside', 'Inside')
	timed('stolaf', 'inside', Date.UTC(2026, 8, 20, 18), Date.UTC(2026, 8, 20, 20))

	event('stolaf', 'before', 0, 'dk-before', 'Before')
	timed('stolaf', 'before', Date.UTC(2026, 8, 1), Date.UTC(2026, 8, 2))

	event('stolaf', 'after', 0, 'dk-after', 'After')
	timed('stolaf', 'after', Date.UTC(2026, 9, 20), Date.UTC(2026, 9, 21))

	event('stolaf', 'straddle', 0, 'dk-straddle', 'Straddle')
	timed('stolaf', 'straddle', Date.UTC(2026, 8, 10), Date.UTC(2026, 8, 20))

	event('stolaf', 'exhibit', 0, 'dk-exhibit', 'Exhibit')
	allDay('stolaf', 'exhibit', '2026-09-11', '2026-12-07')

	event('stolaf', 'oldshow', 0, 'dk-oldshow', 'Old Show')
	allDay('stolaf', 'oldshow', '2026-08-01', '2026-08-05')

	event('stolaf', 'tagged', 0, 'dk-tagged', 'Tagged')
	timed('stolaf', 'tagged', Date.UTC(2026, 8, 21, 12), Date.UTC(2026, 8, 21, 13))
	runner.run({
		sql: 'insert into event_tag values (?,?,?,?)',
		params: ['stolaf', 'tagged', 'category', 'Music'],
	})
	runner.run({
		sql: 'insert into event_tag values (?,?,?,?)',
		params: ['stolaf', 'tagged', 'organization', 'Music Dept'],
	})

	return runner
}

function keysOf(runner: SqlRunner, stmt: Statement): string[] {
	return runner.all<{event_key: string}>(stmt).map((r) => r.event_key)
}

/** Which copy of each event a statement returned, as `source_id|event_key`. */
function copiesOf(runner: SqlRunner, stmt: Statement): string[] {
	return runner
		.all<{source_id: string; event_key: string}>(stmt)
		.map((r) => `${r.source_id}|${r.event_key}`)
}

/**
 * A second calendar's copy of `tagged`, ranked *below* stolaf's, so stolaf's
 * copy wins the dedupe.
 *
 * Everything the cross-source tests turn on is that ranking: query with
 * stolaf switched off and the winner is a row no query may return, while the
 * loser is the only copy of the event left. It carries its own tags, one
 * shared with the winner and one of its own, so the facet and sponsor queries
 * have something to get wrong too.
 */
function addCrossSourceDuplicate(runner: SqlRunner): void {
	runner.run({
		sql: 'insert into event values (?,?,?,?,?,?,?)',
		params: ['presence', 'dup', 1, 'dk-tagged', 'Tagged', 'Somewhere', '{}'],
	})
	runner.run({
		sql: 'insert into occurrence values (?,?,0,?,?,null,null)',
		params: ['presence', 'dup', Date.UTC(2026, 8, 21, 12), Date.UTC(2026, 8, 21, 13)],
	})
	runner.run({
		sql: 'insert into event_tag values (?,?,?,?)',
		params: ['presence', 'dup', 'category', 'Music'],
	})
	runner.run({
		sql: 'insert into event_tag values (?,?,?,?)',
		params: ['presence', 'dup', 'organization', 'Student Activities'],
	})
}

describe('occurrencesQuery', () => {
	it('returns events overlapping the window and nothing outside it', () => {
		let runner = seed()
		let keys = keysOf(
			runner,
			occurrencesQuery({window: WINDOW, sourceIds: ['stolaf'], filters: []}),
		)
		assert.ok(keys.includes('inside'))
		assert.ok(keys.includes('straddle'), 'an event starting before and ending inside overlaps')
		assert.ok(!keys.includes('before'))
		assert.ok(!keys.includes('after'))
	})

	it('matches an all-day event on dates, not instants', () => {
		let runner = seed()
		let keys = keysOf(
			runner,
			occurrencesQuery({window: WINDOW, sourceIds: ['stolaf'], filters: []}),
		)
		assert.ok(keys.includes('exhibit'), 'start_utc is 0 here; only the dates can match')
		assert.ok(!keys.includes('oldshow'))
	})

	it('returns rows in start order', () => {
		let runner = seed()
		let rows = runner.all<{start_utc: number}>(
			occurrencesQuery({window: WINDOW, sourceIds: ['stolaf'], filters: []}),
		)
		let sorted = [...rows].sort((a, b) => a.start_utc - b.start_utc)
		assert.deepEqual(rows, sorted)
	})

	it('narrows to the named sources only', () => {
		let runner = seed()
		let keys = keysOf(
			runner,
			occurrencesQuery({window: WINDOW, sourceIds: ['presence'], filters: []}),
		)
		assert.deepEqual(keys, [])
	})

	it('ands several filter axes together', () => {
		let runner = seed()
		let both = keysOf(
			runner,
			occurrencesQuery({
				window: WINDOW,
				sourceIds: ['stolaf'],
				filters: [
					{axis: 'category', value: 'Music'},
					{axis: 'organization', value: 'Music Dept'},
				],
			}),
		)
		assert.deepEqual(both, ['tagged'])

		let mismatched = keysOf(
			runner,
			occurrencesQuery({
				window: WINDOW,
				sourceIds: ['stolaf'],
				filters: [
					{axis: 'category', value: 'Music'},
					{axis: 'organization', value: 'Athletics'},
				],
			}),
		)
		assert.deepEqual(mismatched, [], 'filters are an AND, not an OR')
	})

	/**
	 * Positional parameters mean the bind order *is* the query's meaning, and
	 * this builder now repeats the source list once per filter as well as once
	 * in the ranking subquery. A count mismatch is the cheap half of that going
	 * wrong; the property test below catches the rest.
	 */
	it('binds exactly as many parameters as the assembled statement has placeholders', () => {
		for (let filters of [
			[],
			[{axis: 'category', value: 'Music'} as const],
			[
				{axis: 'category', value: 'Music'} as const,
				{axis: 'organization', value: 'Music Dept'} as const,
			],
		]) {
			let {sql, params} = occurrencesQuery({
				window: WINDOW,
				sourceIds: ['stolaf', 'presence'],
				filters: [...filters],
			})
			assert.equal(
				(sql.match(/\?/gu) ?? []).length,
				params.length,
				`${filters.length} filter(s): placeholders and params disagree`,
			)
		}
	})

	it('shows one copy of an event two calendars both carry, the lowest-ranked one', () => {
		let runner = seed()
		addCrossSourceDuplicate(runner)

		let copies = copiesOf(
			runner,
			occurrencesQuery({
				window: WINDOW,
				sourceIds: ['stolaf', 'presence'],
				filters: [{axis: 'category', value: 'Music'}],
			}),
		)
		assert.deepEqual(copies, ['stolaf|tagged'], 'source_rank decides, not insertion order')
	})

	it('keeps events with distinct dedupe keys separate', () => {
		let runner = seed()
		let keys = keysOf(
			runner,
			occurrencesQuery({window: WINDOW, sourceIds: ['stolaf'], filters: []}),
		)
		assert.equal(new Set(keys).size, keys.length, 'nothing here shares a dedupe key')
		assert.ok(keys.includes('inside'))
		assert.ok(keys.includes('tagged'))
	})

	/**
	 * The case a dedupe computed over every source silently loses.
	 *
	 * Ranking the dedupe across the whole `event` table and narrowing to the
	 * requested sources afterwards deletes an event outright whenever the
	 * winner belongs to a calendar that is switched off: the winner is filtered
	 * away by the source clause, and the loser was already suppressed by the
	 * ranking. Nothing is left, and it does not heal -- a disabled source's
	 * query never runs, so `writeSource` never refreshes or prunes its rows and
	 * they keep winning dedupes for as long as the calendar stays off.
	 *
	 * The dedupe therefore has to run over the requested sources only, which is
	 * exactly what the deleted `dedupeEvents` did: it only ever saw the events
	 * of calendars that were on.
	 */
	it('returns the losing copy when the winning copy belongs to a calendar that is off', () => {
		let runner = seed()
		addCrossSourceDuplicate(runner)

		let copies = copiesOf(
			runner,
			occurrencesQuery({window: WINDOW, sourceIds: ['presence'], filters: []}),
		)
		assert.deepEqual(
			copies,
			['presence|dup'],
			'the event disappears entirely if the dedupe ranks across sources the query excluded',
		)
	})
})

describe('facetsQuery', () => {
	it('counts an event once however many occurrences it has in range', () => {
		let runner = seed()
		// A second occurrence for the same event, also inside the window.
		runner.run({
			sql: 'insert into occurrence values (?,?,0,?,?,null,null)',
			params: ['stolaf', 'tagged', Date.UTC(2026, 8, 28, 12), Date.UTC(2026, 8, 28, 13)],
		})
		let rows = runner.all<{value: string; count: number}>(
			facetsQuery({axis: 'category', window: WINDOW, sourceIds: ['stolaf']}),
		)
		assert.deepEqual(rows, [{value: 'Music', count: 1}])
	})

	it('unions tags across a dedupe key and counts the event once', () => {
		let runner = seed()
		runner.run({
			sql: 'insert into event values (?,?,?,?,?,?,?)',
			params: ['presence', 'dup', 1, 'dk-tagged', 'Tagged', 'Somewhere', '{}'],
		})
		runner.run({
			sql: 'insert into occurrence values (?,?,0,?,?,null,null)',
			params: ['presence', 'dup', Date.UTC(2026, 8, 21, 12), Date.UTC(2026, 8, 21, 13)],
		})
		runner.run({
			sql: 'insert into event_tag values (?,?,?,?)',
			params: ['presence', 'dup', 'organization', 'Student Activities'],
		})

		let rows = runner.all<{value: string; count: number}>(
			facetsQuery({axis: 'organization', window: WINDOW, sourceIds: ['stolaf', 'presence']}),
		)
		assert.deepEqual(rows, [
			{value: 'Student Activities', count: 1},
			{value: 'Music Dept', count: 1},
		])
	})

	it('sorts Z-A, because the SwiftUI menu renders bottom-to-top', () => {
		let runner = seed()
		runner.run({
			sql: 'insert into event_tag values (?,?,?,?)',
			params: ['stolaf', 'inside', 'category', 'Athletics'],
		})
		let rows = runner.all<{value: string}>(
			facetsQuery({axis: 'category', window: WINDOW, sourceIds: ['stolaf']}),
		)
		assert.deepEqual(
			rows.map((r) => r.value),
			['Music', 'Athletics'],
		)
	})

	// The case that actually distinguishes count(distinct dedupe_key) from
	// count(*): one event carried by two calendars, both tagging it the same.
	// It is one event to the user, so the menu must say 1 -- and filtering on
	// that value returns one deduped event, so a 2 here would be the menu
	// lying about what the filter will do. None of the cases above builds this
	// shape, so without it the aggregate choice is untested.
	it('counts a cross-source duplicate once when both copies carry the tag', () => {
		let runner = seed()
		runner.run({
			sql: 'insert into event values (?,?,?,?,?,?,?)',
			params: ['presence', 'dup2', 1, 'dk-tagged', 'tagged', 'Somewhere', '{}'],
		})
		runner.run({
			sql: 'insert into occurrence values (?,?,0,?,?,null,null)',
			params: ['presence', 'dup2', Date.UTC(2026, 8, 21, 12), Date.UTC(2026, 8, 21, 13)],
		})
		runner.run({
			sql: 'insert into event_tag values (?,?,?,?)',
			params: ['presence', 'dup2', 'category', 'Music'],
		})

		let rows = runner.all<{value: string; count: number}>(
			facetsQuery({axis: 'category', window: WINDOW, sourceIds: ['stolaf', 'presence']}),
		)
		assert.deepEqual(rows, [{value: 'Music', count: 1}])
	})

	/**
	 * The invariant the menu depends on: a value tallied as N must filter to N
	 * events, or the menu offers a choice that empties the list.
	 *
	 * Run over three selections, each with a cross-source duplicate present,
	 * because they fail for different reasons.
	 *
	 * One calendar at a time catches a dedupe that ranks across sources the
	 * query excluded: the pass has a copy of an event whose winner belongs to
	 * the calendar it switched off.
	 *
	 * Both calendars at once catches the other half. `facetsQuery` tallies a
	 * tag every in-scope copy carries, and `organizationsQuery` and `hydrate`
	 * print that same union on the row -- so a filter that matches only the
	 * *winning* copy's tags cannot reach a tag only a displaced copy carries.
	 * The menu then offers a sponsor printed on the row in front of the
	 * reader, and selecting it empties the list. The deleted array path could
	 * not do this: `tally` and `filterEvents` both read one deduped list whose
	 * `organization` was already the union, so they agreed by construction.
	 */
	for (let sourceIds of [['stolaf'], ['presence'], ['stolaf', 'presence']]) {
		it(`agrees with the filter query for every value it reports, with ${sourceIds.join(' and ')} on`, () => {
			let runner = seed()
			addCrossSourceDuplicate(runner)

			for (let axis of ['category', 'organization'] as const) {
				let facets = runner.all<{value: string; count: number}>(
					facetsQuery({axis, window: WINDOW, sourceIds}),
				)
				assert.ok(facets.length > 0, `${axis} produced no facets to check`)
				for (let facet of facets) {
					let matched = runner.all<{event_key: string}>(
						occurrencesQuery({
							window: WINDOW,
							sourceIds,
							filters: [{axis, value: facet.value}],
						}),
					)
					let distinct = new Set(matched.map((row) => row.event_key))
					assert.equal(
						distinct.size,
						facet.count,
						`"${facet.value}" is tallied ${facet.count} but filters to ${distinct.size}`,
					)
				}
			}
		})
	}
})

describe('organizationsQuery', () => {
	/**
	 * The ordering test. The realistic fixture below proves the union happens
	 * at all, but it cannot prove the ordering: with `Music Dept` on the
	 * rank-0 winner and inserted first, and `Student Activities` on the
	 * rank-1 loser inserted second, the required ordering, plain insertion
	 * order, and plain alphabetical order all produce the same answer — so an
	 * implementation that dropped the in-aggregate `order by` and leaned on
	 * the subquery's natural order would pass it.
	 *
	 * This fixture is built so that only `order by source_rank, tag_rowid`
	 * produces the asserted result. The loser's tag is inserted FIRST, and
	 * the winner's two tags are in non-alphabetical order, which also pins
	 * the tie-break: the winner's own names keep their own order. Measured
	 * against real SQLite:
	 *
	 *   order by source_rank, tag_rowid  -> Zoology Dept, Anthropology Dept, Athletics
	 *   order by tag_rowid               -> Athletics, Zoology Dept, Anthropology Dept
	 *   order by value                   -> Anthropology Dept, Athletics, Zoology Dept
	 *   no order by                      -> Anthropology Dept, Athletics, Zoology Dept
	 */
	it('orders sponsors by source rank, then by insertion within a source', () => {
		let runner = seed()
		let event = (sourceId: string, key: string, rank: number) =>
			runner.run({
				sql: 'insert into event values (?,?,?,?,?,?,?)',
				params: [sourceId, key, rank, 'dk-gala', 'Gala', 'Somewhere', '{}'],
			})
		let tag = (sourceId: string, key: string, value: string) =>
			runner.run({
				sql: 'insert into event_tag values (?,?,?,?)',
				params: [sourceId, key, 'organization', value],
			})

		event('stolaf', 'gala-w', 0)
		event('presence', 'gala-l', 1)
		// The loser's tag first, so insertion order disagrees with rank order.
		tag('presence', 'gala-l', 'Athletics')
		// The winner's two out of alphabetical order, so alphabetical
		// disagrees too, and the within-source tie-break is decidable.
		tag('stolaf', 'gala-w', 'Zoology Dept')
		tag('stolaf', 'gala-w', 'Anthropology Dept')

		let rows = runner.all<{dedupe_key: string; orgs: string}>(
			organizationsQuery(['dk-gala'], ['stolaf', 'presence']),
		)
		assert.equal(rows.length, 1)
		assert.deepEqual(rows[0].orgs.split(ORG_SEPARATOR), [
			'Zoology Dept',
			'Anthropology Dept',
			'Athletics',
		])
	})

	it('keeps the sponsor ordering inside the aggregate, not in a subquery', () => {
		// Row-based tests cannot catch this. Moving the `order by` out of
		// `group_concat` and into the enclosing subquery produces identical rows
		// on SQLite 3.53.4 -- measured -- because the planner happens to feed
		// the aggregate in the subquery's order. SQLite does not promise that: a
		// subquery's `order by` may be optimised away, and an aggregate's input
		// order is undefined unless ordered within the aggregate itself.
		//
		// This module is a string builder, so the SQL it emits IS its behaviour.
		// Asserting the shape is what stops a later "simplification" from
		// reintroducing a spelling that is correct only by luck.
		let {sql} = organizationsQuery(['dk-gala'], ['stolaf', 'presence'])
		assert.match(sql, /group_concat\([^)]*order by[^)]*\)/u)
	})

	it('unions sponsors across the copies of one event', () => {
		let runner = seed()
		runner.run({
			sql: 'insert into event values (?,?,?,?,?,?,?)',
			params: ['presence', 'dup', 1, 'dk-tagged', 'Tagged', 'Somewhere', '{}'],
		})
		runner.run({
			sql: 'insert into event_tag values (?,?,?,?)',
			params: ['presence', 'dup', 'organization', 'Student Activities'],
		})

		let rows = runner.all<{dedupe_key: string; orgs: string}>(
			organizationsQuery(['dk-tagged'], ['stolaf', 'presence']),
		)
		assert.equal(rows.length, 1)
		assert.deepEqual(rows[0].orgs.split(ORG_SEPARATOR), ['Music Dept', 'Student Activities'])
	})

	/**
	 * The union is across the copies a *reader* can see, not across every copy
	 * stored. Grouping tags by `dedupe_key` over the whole `event` table lets a
	 * switched-off calendar contribute a sponsor to an event the reader is
	 * looking at from another calendar -- a name `facetsQuery` will never offer
	 * and no filter can match, appearing on a row anyway. The deleted
	 * `dedupeEvents` merged only the calendars that were on.
	 */
	it('leaves out a sponsor named only by a calendar that is off', () => {
		let runner = seed()
		addCrossSourceDuplicate(runner)

		let rows = runner.all<{dedupe_key: string; orgs: string}>(
			organizationsQuery(['dk-tagged'], ['stolaf']),
		)
		assert.equal(rows.length, 1)
		assert.deepEqual(rows[0].orgs.split(ORG_SEPARATOR), ['Music Dept'])
	})
})

describe('oneEventQuery', () => {
	it('resolves a single event by its own source and key', () => {
		let runner = seed()
		let rows = runner.all<{source_id: string; event_key: string; start_utc: number}>(
			oneEventQuery('stolaf', 'inside'),
		)
		assert.equal(rows.length, 1)
		assert.equal(rows[0].source_id, 'stolaf')
		assert.equal(rows[0].event_key, 'inside')
		assert.equal(rows[0].start_utc, Date.UTC(2026, 8, 20, 18))
	})

	it('returns nothing for a key that does not exist', () => {
		let runner = seed()
		let rows = runner.all(oneEventQuery('stolaf', 'nope'))
		assert.deepEqual(rows, [])
	})

	// The case this query exists for: a deep link names one source's copy of
	// an event, and it has to resolve even when another source's copy won the
	// dedupe. Ranking by `dedupe_key`, as the list query does, would 404 the
	// loser -- selecting from `event` directly must not.
	it('resolves the losing copy of a duplicated event, not just the winner', () => {
		let runner = seed()
		runner.run({
			sql: 'insert into event values (?,?,?,?,?,?,?)',
			params: ['presence', 'dup', 1, 'dk-inside', 'Inside (Presence copy)', 'Somewhere', '{}'],
		})
		runner.run({
			sql: 'insert into occurrence values (?,?,0,?,?,null,null)',
			params: ['presence', 'dup', Date.UTC(2026, 8, 20, 18), Date.UTC(2026, 8, 20, 20)],
		})

		// The winner, by source_rank, is 'stolaf'/'inside' -- confirm the loser
		// is absent from the list query before proving the direct query still
		// reaches it.
		let listed = copiesOf(
			runner,
			occurrencesQuery({window: WINDOW, sourceIds: ['stolaf', 'presence'], filters: []}),
		)
		assert.ok(listed.includes('stolaf|inside'))
		assert.ok(!listed.includes('presence|dup'), 'the list shows only the winning copy')

		let rows = runner.all<{source_id: string; event_key: string; dedupe_key: string}>(
			oneEventQuery('presence', 'dup'),
		)
		assert.equal(rows.length, 1)
		assert.equal(rows[0].source_id, 'presence')
		assert.equal(rows[0].event_key, 'dup')
		assert.equal(rows[0].dedupe_key, 'dk-inside')
	})
})

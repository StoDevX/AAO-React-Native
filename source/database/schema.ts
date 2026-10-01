import {CALENDAR_CREATE_SQL} from './calendar/schema.ts'
import type {SqlRunner} from './sql.ts'

/** Bump when any DDL below changes. A mismatch wipes and rebuilds. */
export const SCHEMA_VERSION = 2

const META_CREATE = `
create table if not exists meta (
  key   text primary key,
  value text not null
);`

/**
 * Everything a reset drops, children before parents.
 *
 * `visible_event` is dropped although `CREATE_SQL` no longer builds it: a
 * database written under an earlier `SCHEMA_VERSION` can still hold that view,
 * and a view over a dropped table is not an error in SQLite, so an undropped
 * one outlives every table it names and would collide with any later view
 * taking its name.
 */
export const RESET_SQL = `
drop view  if exists visible_event;
drop table if exists event_tag;
drop table if exists occurrence;
drop table if exists event;
drop table if exists meta;`

export const CREATE_SQL = `${META_CREATE}${CALENDAR_CREATE_SQL}`

/**
 * Brings `runner` to the current schema, wiping it if it is not already there.
 * Returns whether it wiped.
 *
 * `fingerprint` folds every reason to rebuild into one comparison — the schema
 * version and the device's timezone. The timezone belongs here because
 * `eventKey` is derived from an event's `Moment`, and for an all-day event
 * `convertEvents` builds that from *device-local* midnight: an `event_key`
 * stored in one zone will not match a key recomputed in another. Nothing here
 * is anything but a cache of a refetchable window, so wiping is always the
 * safe answer.
 *
 * `getRunner` computes the fingerprint once per process, so a zone change is
 * noticed on the next cold start rather than the moment it happens. A user who
 * changes zone mid-session sees all-day events off by a day until then, which
 * is the behaviour they already get today from the keys in the persisted
 * cache. Watching `AppState` for it would be a real fix and is deliberately
 * not in this plan.
 */
export function ensureSchema(runner: SqlRunner, fingerprint: string): boolean {
	runner.exec(META_CREATE)

	let found = runner.all<{value: string}>({
		sql: 'select value from meta where key = ?',
		params: ['fingerprint'],
	})

	if (found[0]?.value === fingerprint) return false

	runner.exec(RESET_SQL)
	runner.exec(CREATE_SQL)
	runner.run({
		sql: 'insert into meta (key, value) values (?, ?)',
		params: ['fingerprint', fingerprint],
	})
	return true
}

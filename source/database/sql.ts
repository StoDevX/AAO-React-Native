/** A value SQLite can bind. Blobs are not used here. */
export type BindValue = string | number | null

/**
 * A SQL statement and its positional parameters.
 *
 * Positional rather than named so the same statement binds identically under
 * `expo-sqlite` on device and `node:sqlite` in tests — the two disagree about
 * named-parameter prefixes.
 */
export type Statement = {sql: string; params: BindValue[]}

/**
 * Somewhere to run a `Statement`. `client.ts` implements this over
 * `expo-sqlite`; `testing/harness.ts` implements it over `node:sqlite`. Every
 * query and write here takes one, so none of them import a driver.
 */
export interface SqlRunner {
	exec(sql: string): void
	all<Row>(stmt: Statement): Row[]
	run(stmt: Statement): void
	/**
	 * Runs `task` as one transaction: everything it writes commits together,
	 * or none of it does. A throw inside `task` rolls the transaction back and
	 * rethrows, leaving the database exactly as it was.
	 */
	transaction(task: () => void): void
}

/**
 * `count` comma-separated `?` placeholders, for an `in (...)` clause. A list
 * cannot be bound as a single parameter, so the clause is built to fit it.
 */
export function placeholders(count: number): string {
	return Array.from({length: count}, () => '?').join(',')
}

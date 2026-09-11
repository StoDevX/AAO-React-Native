import type {Run} from './diff'

/**
 * Drops a single trailing full stop, so a definition written as a sentence can
 * still be followed by `: example` without reading as `modify.: both parties`.
 * Question and exclamation marks stay: they carry meaning a colon does not
 * replace.
 */
export function withoutFullStop(definition: string): string {
	return definition.endsWith('.') ? definition.slice(0, -1) : definition
}

/// The text a marked-up definition carried before the edit -- `same` and
/// `removed` runs, in order, skipping only what the edit itself inserted.
function beforeText(runs: Run[]): string {
	return runs
		.filter((run) => run.mark !== 'added')
		.map((run) => run.text)
		.join('')
}

/**
 * `withoutFullStop` widened for marked runs: a definition's own last word is
 * exactly what an edit is most likely to touch, which puts its trailing full
 * stop inside a marked run more often than not.
 *
 * Trimmed only when the full stop survived the edit unremarked -- the last
 * run ends in `.` *and* the pre-edit text already ended in `.` too, so the
 * character carries no information about what changed. `"modify"` →
 * `"modify."` fails that second test and keeps its full stop, since there the
 * period *is* the edit. `"modify."` → `"change."` passes it: the removed run
 * keeps its own trailing `.` (it is exactly what was struck through), and
 * only the last run's redundant one -- the one that would otherwise collide
 * with the colon ahead of a citation -- is dropped.
 */
export function withoutTrailingFullStop(runs: Run[]): Run[] {
	let last = runs[runs.length - 1]
	if (!last || !last.text.endsWith('.') || !beforeText(runs).endsWith('.')) {
		return runs
	}
	return [...runs.slice(0, -1), {...last, text: last.text.slice(0, -1)}]
}

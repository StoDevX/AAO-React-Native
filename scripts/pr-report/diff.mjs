/**
 * Compare a pull request's size report with master's.
 */

/**
 * Diffs two name→bytes maps. A name missing on one side gets null there, so
 * the report can tell a new package from one that grew.
 */
export function diffGroups(before, after) {
	let names = new Set([...Object.keys(before), ...Object.keys(after)])
	let changes = [...names].map((name) => {
		let was = before[name] ?? null
		let now = after[name] ?? null
		return {name, before: was, after: now, delta: (now ?? 0) - (was ?? 0)}
	})
	return changes.sort(
		(a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.name.localeCompare(b.name),
	)
}

/** Diffs every figure two size reports share. */
export function diffReports(baseline, head) {
	let total = (name, key) => ({
		name,
		before: baseline.js[key],
		after: head.js[key],
		delta: head.js[key] - baseline.js[key],
	})
	return {
		minified: total('minified', 'minifiedBytes'),
		hermes: total('hermes', 'hermesBytes'),
		byPackage: diffGroups(baseline.js.byPackage, head.js.byPackage),
		byFeature: diffGroups(baseline.js.byFeature, head.js.byFeature),
	}
}

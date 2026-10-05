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

const byName = (a, b) => a.localeCompare(b)

/**
 * Diffs two name→versions maps. A package is added or removed when its name
 * is on one side only, and bumped when its versions differ (the lists are
 * sorted, so a join compares them). Duplicates are the packages with two or
 * more versions in `after`, new when `before` had fewer.
 */
export function diffPackages(before, after) {
	let names = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort(byName)
	let changes = []
	for (let name of names) {
		let was = before[name] ?? null
		let now = after[name] ?? null
		if (was === null) {
			changes.push({name, kind: 'added', before: null, after: now})
		} else if (now === null) {
			changes.push({name, kind: 'removed', before: was, after: null})
		} else if (was.join(',') !== now.join(',')) {
			changes.push({name, kind: 'bumped', before: was, after: now})
		}
	}
	let duplicates = Object.keys(after)
		.sort(byName)
		.filter((name) => after[name].length > 1)
		.map((name) => ({
			name,
			versions: after[name],
			isNew: (before[name]?.length ?? 0) < 2,
		}))
	return {changes, duplicates}
}

/** Diffs every figure two size reports share, JS and dependencies. */
export function diffReports(baseline, head) {
	let total = (name, key) => ({
		name,
		before: baseline.js[key],
		after: head.js[key],
		delta: head.js[key] - baseline.js[key],
	})
	return {
		hermes: total('hermes', 'hermesBytes'),
		byPackage: diffGroups(baseline.js.byPackage, head.js.byPackage),
		byFeature: diffGroups(baseline.js.byFeature, head.js.byFeature),
		deps: {
			nodeModules: {
				name: 'node_modules',
				before: baseline.deps.nodeModulesBytes,
				after: head.deps.nodeModulesBytes,
				delta: head.deps.nodeModulesBytes - baseline.deps.nodeModulesBytes,
			},
			...diffPackages(baseline.deps.packages, head.deps.packages),
		},
	}
}

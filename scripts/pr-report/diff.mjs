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

/** What one installed version costs; zero for one the report has no size for. */
function sizeOf(deps, name, version) {
	return deps.sizes[`${name}@${version}`] ?? {installed: 0, bundled: 0}
}

/** What a package's versions cost together, or nothing for a side without the package. */
function totalSize(deps, name, versions) {
	let total = {installed: 0, bundled: 0}
	for (let version of versions ?? []) {
		let size = sizeOf(deps, name, version)
		total.installed += size.installed
		total.bundled += size.bundled
	}
	return total
}

/** The `key` bytes (`installed` or `bundled`) a duplicate's versions cost together. */
const cost = (duplicate, key) => duplicate.versions.reduce((sum, v) => sum + v[key], 0)

/**
 * Diffs two reports' `deps`. A package is added or removed when its name is
 * on one side only, and bumped when its versions differ (the lists are
 * sorted, so a join compares them); each change carries how many installed
 * and bundled bytes it adds. Changes come largest first, by bundled bytes,
 * then installed bytes, since the bundle is what ships. Duplicates are the
 * packages with two or more versions in `after`, new when `before` had
 * fewer, in the same order by what their versions cost.
 */
export function diffPackages(before, after) {
	let names = [...new Set([...Object.keys(before.packages), ...Object.keys(after.packages)])].sort(
		byName,
	)
	let changes = []
	for (let name of names) {
		let was = before.packages[name] ?? null
		let now = after.packages[name] ?? null
		let kind = null
		if (was === null) {
			kind = 'added'
		} else if (now === null) {
			kind = 'removed'
		} else if (was.join(',') !== now.join(',')) {
			kind = 'bumped'
		}
		if (kind !== null) {
			let wasSize = totalSize(before, name, was)
			let nowSize = totalSize(after, name, now)
			changes.push({
				name,
				kind,
				before: was,
				after: now,
				installedDelta: nowSize.installed - wasSize.installed,
				bundledDelta: nowSize.bundled - wasSize.bundled,
			})
		}
	}
	changes.sort(
		(a, b) =>
			Math.abs(b.bundledDelta) - Math.abs(a.bundledDelta) ||
			Math.abs(b.installedDelta) - Math.abs(a.installedDelta) ||
			byName(a.name, b.name),
	)

	let duplicates = Object.keys(after.packages)
		.filter((name) => after.packages[name].length > 1)
		.map((name) => ({
			name,
			isNew: (before.packages[name]?.length ?? 0) < 2,
			versions: after.packages[name].map((version) => ({
				version,
				...sizeOf(after, name, version),
			})),
		}))
	duplicates.sort(
		(a, b) =>
			cost(b, 'bundled') - cost(a, 'bundled') ||
			cost(b, 'installed') - cost(a, 'installed') ||
			byName(a.name, b.name),
	)
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
			...diffPackages(baseline.deps, head.deps),
		},
	}
}

/** One figure of two app reports, as a change. */
function figure(name, baseline, head, key) {
	return {name, before: baseline[key], after: head[key], delta: head[key] - baseline[key]}
}

/** An app report's groups and assets as one map, each asset named under the catalog that holds it. */
function appRows(report) {
	return {
		...report.byGroup,
		...Object.fromEntries(
			Object.entries(report.byAsset).map(([name, bytes]) => [`Assets.car › ${name}`, bytes]),
		),
	}
}

/**
 * Diffs two app reports: install and download size, and every group and
 * asset as one list.
 */
export function diffApp(baseline, head) {
	return {
		install: figure('install', baseline, head, 'installBytes'),
		download: figure('download', baseline, head, 'downloadBytes'),
		rows: diffGroups(appRows(baseline), appRows(head)),
	}
}

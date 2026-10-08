// The map fixtures the UI tests read, in source/features/map/__fixtures__/:
// what each campus's ccc-server served, stored so that a refresh shows only
// what changed in the data.

/** Each campus, and where its live map is served. */
export const CAMPUSES = {
	stolaf: 'https://stolaf.frogpond.tech/v1/map/geojson',
	carleton: 'https://carleton.frogpond.tech/v1/map/geojson',
}

/** `value` with every object's keys in order, at every depth; arrays keep theirs. */
function sortKeys(value) {
	if (Array.isArray(value)) {
		return value.map(sortKeys)
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((key) => [key, sortKeys(value[key])]),
		)
	}
	return value
}

/**
 * A map as its fixture file holds it, before oxfmt lays it out: keys sorted,
 * so the server's key order never shows as a change, and on one line, so
 * oxfmt keeps short objects such as a point on one line too.
 */
export function renderFixture(map) {
	return `${JSON.stringify(sortKeys(map))}\n`
}

/** Refuses a response with no places, which is an outage, not a map. */
export function checkMap(campus, map) {
	if (!Array.isArray(map?.features) || map.features.length === 0) {
		throw new Error(`${campus}: no places in the response; the fixture is left as it was`)
	}
}

/** A map's places by id. */
function byId(map) {
	return new Map(map.features.map((feature) => [feature.id, feature]))
}

/** Whether two places hold the same data, whatever order their keys are in. */
function same(a, b) {
	return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b))
}

function byText(a, b) {
	return String(a).localeCompare(String(b))
}

/** The places `after` adds and removes against `before`, and how many it changes. */
export function summarizeChange(before, after) {
	let old = byId(before)
	let next = byId(after)
	return {
		added: [...next.keys()].filter((id) => !old.has(id)).sort(byText),
		removed: [...old.keys()].filter((id) => !next.has(id)).sort(byText),
		changed: [...next.keys()].filter((id) => old.has(id) && !same(old.get(id), next.get(id)))
			.length,
	}
}

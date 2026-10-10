// Infers one JSON Schema from many JSON samples, for the fixture schema check
// (source/features/campus/fixture-endpoints.ts). Written here because
// genson-js, the usual tool, has not been updated since 2022.

/** A value's JSON type. Integers and fractions are both `number`. */
function typeOf(value) {
	if (value === null) return 'null'
	if (Array.isArray(value)) return 'array'
	return typeof value === 'object' ? 'object' : typeof value
}

/** Whether every key of every object in `objects` is a run of digits: an id-keyed map, not a record. */
function isMap(objects) {
	let keys = objects.flatMap((object) => Object.keys(object))
	return keys.length > 0 && keys.every((key) => /^\d+$/u.test(key))
}

function objectSchema(objects) {
	if (isMap(objects)) {
		return {type: 'object', additionalProperties: inferSchema(objects.flatMap(Object.values))}
	}
	let names = [...new Set(objects.flatMap((object) => Object.keys(object)))].sort((a, b) =>
		a < b ? -1 : a > b ? 1 : 0,
	)
	let properties = Object.fromEntries(
		names.map((name) => [
			name,
			inferSchema(objects.filter((object) => name in object).map((object) => object[name])),
		]),
	)
	let required = names.filter((name) => objects.every((object) => name in object))
	return {type: 'object', properties, ...(required.length > 0 ? {required} : {})}
}

/**
 * One schema every sample satisfies: a property is required only when every
 * object sample has it, array items merge across arrays, and samples of
 * different types make a union. An object keyed only by numbers is a map, its
 * values merged.
 */
export function inferSchema(samples) {
	let byType = new Map()
	for (let sample of samples) {
		let type = typeOf(sample)
		let values = byType.get(type) ?? []
		values.push(sample)
		byType.set(type, values)
	}
	let schemas = [...byType].map(([type, values]) => {
		if (type === 'object') return objectSchema(values)
		if (type === 'array') {
			let items = values.flat()
			return {type: 'array', items: items.length > 0 ? inferSchema(items) : {}}
		}
		return {type}
	})
	if (schemas.length === 1) return schemas[0]
	if (schemas.every((schema) => Object.keys(schema).length === 1)) {
		return {type: schemas.map((schema) => schema.type)}
	}
	return {anyOf: schemas}
}
